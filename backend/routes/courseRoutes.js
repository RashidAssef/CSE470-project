import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  getInstructorCourses,
  updateCourseInstructors,
  getActiveInstructors
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==========================================
// COURSE BROWSING ROUTES (Public)
// ==========================================
router.get('/', getCourses);
router.get('/instructors/active', protect, getActiveInstructors);
router.get('/instructor/my', protect, authorize('instructor'), getInstructorCourses);
router.get('/:id', getCourseById);

// ==========================================
// COURSE MANAGEMENT ROUTES (Private)
// ==========================================
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.patch('/:id/instructors', protect, authorize('admin'), updateCourseInstructors);

export default router;
