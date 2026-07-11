import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication protecting middleware.
 * Verifies JWT signature and attaches authenticated user profile to req.user.
 * Blocks requests from accounts that have been suspended.
 * 
 * @async
 * @function protect
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header as Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify signature of the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user from database using decoded ID, excluding the password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.',
        });
      }

      // Check if user is suspended
      if (req.user.status === 'suspended') {
        return res.status(403).json({
          status: 'fail',
          message: 'Your account has been suspended. Please contact administration.',
        });
      }

      // Continue to next middleware
      next();
    } catch (error) {
      console.error(`[Auth Middleware] JWT Verification Failed: ${error.message}`);
      return res.status(401).json({
        status: 'fail',
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized, no token provided',
    });
  }
};

/**
 * Role authorization middleware.
 * Restricts access to endpoints based on user roles (e.g. 'admin', 'instructor').
 * MUST be applied AFTER 'protect' middleware.
 * 
 * @function authorize
 * @param {...string} roles - List of allowed roles for the route
 * @returns {Function} Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        status: 'error',
        message: 'Authorization middleware executed before authentication protection.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `User role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};
