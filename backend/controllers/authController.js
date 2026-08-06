import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generates a JSON Web Token (JWT) signed with user ID.
 * 
 * @param {string} id - The MongoDB User ID
 * @returns {string} Signed JWT token string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

/**
 * @desc    Register a new user (Student, Instructor, Admin)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signupUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email and password',
      });
    }

    // 2. Validate role selection
    if (role && !['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user role selected',
      });
    }

    // 3. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email address',
      });
    }

    // 4. Create new user document
    // Note: Schema pre-save hook will automatically hash the password and assign role-based status.
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid user data provided',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // 2. Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // 3. Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // 4. Handle Account Status Constraints
    if (user.status === 'suspended') {
      return res.status(403).json({
        status: 'fail',
        message: 'Your account has been suspended. Please contact the administrator.',
      });
    }

    // Note: If instructor is pending approval, we can let them log in but restrict their actions on the frontend
    // or block their login here. The user requested "instructors need approval from admins".
    // Blocking login or restricting access is cleaner. Let's send the status back so the client handles it,
    // but also block full access on protected instructor backend endpoints.

    res.status(200).json({
      status: 'success',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user's profile details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      status: 'success',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found',
      });
    }

    const { name, email, phone, occupation, password } = req.body;

    if (name) user.name = name;
    
    if (email) {
      if (email.toLowerCase() !== user.email.toLowerCase()) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({
            status: 'fail',
            message: 'Email address already in use',
          });
        }
        user.email = email;
      }
    }

    if (phone !== undefined) user.phone = phone;
    if (occupation !== undefined) user.occupation = occupation;
    if (password) user.password = password; // Hashing is handled by userSchema.pre('save')

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone || '',
        occupation: user.occupation || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookmarked courses in wishlist
 * @route   GET /api/auth/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: [
        { path: 'instructor', select: 'name' },
        { path: 'category', select: 'name' }
      ]
    });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    res.status(200).json({
      status: 'success',
      results: user.wishlist.length,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add course to wishlist
 * @route   POST /api/auth/wishlist/:courseId
 * @access  Private
 */
export const addToWishlist = async (req, res, next) => {
  const { courseId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    if (user.wishlist.includes(courseId)) {
      return res.status(400).json({ status: 'fail', message: 'Course is already in your wishlist' });
    }

    user.wishlist.push(courseId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Course added to wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove course from wishlist
 * @route   DELETE /api/auth/wishlist/:courseId
 * @access  Private
 */
export const removeFromWishlist = async (req, res, next) => {
  const { courseId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== courseId.toString());
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Course removed from wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
};


