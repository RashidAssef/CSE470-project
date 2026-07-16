import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentStatus,
  unenrollFromCourse,
  getCourseEnrollments,
  removeStudentFromCourse,
} from '../controllers/enrollmentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==========================================
// STUDENT ENROLLMENT ROUTES
// ==========================================
router.get('/my', protect, authorize('student'), getMyEnrollments);
router.get('/status/:courseId', protect, getEnrollmentStatus);
router.post('/:courseId', protect, authorize('student'), enrollInCourse);
router.delete('/:id', protect, authorize('student'), unenrollFromCourse);

// ==========================================
// ADMIN MEMBERSHIP MANAGEMENT ROUTES
// ==========================================
router.get('/course/:courseId', protect, authorize('admin'), getCourseEnrollments);
router.delete('/course/:courseId/student/:studentId', protect, authorize('admin'), removeStudentFromCourse);

export default router;
