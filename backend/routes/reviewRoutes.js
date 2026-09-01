import express from 'express';
import {
  getCourseReviews,
  submitReview,
  getMyReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Mounted under /api/courses/:courseId/reviews (see courseRoutes.js)
router.get('/', getCourseReviews); // public — helps prospective students
router.post('/', protect, submitReview); // student, must be enrolled
router.get('/my', protect, getMyReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
