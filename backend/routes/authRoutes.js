import express from 'express';
import { signupUser, loginUser, getMe, updateProfile, getWishlist, addToWishlist, removeFromWishlist } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signupUser);
router.post('/login', loginUser);

// Private routes (requires valid JWT token)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Wishlist management routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:courseId', protect, addToWishlist);
router.delete('/wishlist/:courseId', protect, removeFromWishlist);

export default router;


