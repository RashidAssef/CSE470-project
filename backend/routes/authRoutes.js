import express from 'express';
import { signupUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signupUser);
router.post('/login', loginUser);

// Private route (requires valid JWT token)
router.get('/me', protect, getMe);

export default router;
