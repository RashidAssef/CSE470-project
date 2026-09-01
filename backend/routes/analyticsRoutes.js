import express from 'express';
import { getInstructorAnalytics, getAdminAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Cross-course dashboards. The single-course analytics endpoint
// (GET /api/courses/:courseId/analytics) is mounted separately inside
// courseRoutes.js so it sits alongside the course it describes.
router.get('/instructor', protect, authorize('instructor'), getInstructorAnalytics);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);

export default router;
