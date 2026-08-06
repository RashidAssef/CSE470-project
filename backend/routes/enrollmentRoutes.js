import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  getEnrollmentStatus,
  unenrollFromCourse,
  getCourseEnrollments,
  removeStudentFromCourse,
  enrollStudentInCourseAdmin,
  enrollStudentsInCourseBulkAdmin,
  getActiveStudents,
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
// MEMBERSHIP MANAGEMENT ROUTES (Admin & Instructor)
// ==========================================
router.get('/active-students', protect, authorize('admin', 'instructor'), getActiveStudents);
router.get('/course/:courseId', protect, authorize('admin', 'instructor'), getCourseEnrollments);
router.post('/course/:courseId/student/:studentId', protect, authorize('admin', 'instructor'), enrollStudentInCourseAdmin);
router.post('/course/:courseId/students', protect, authorize('admin'), enrollStudentsInCourseBulkAdmin);
router.delete('/course/:courseId/student/:studentId', protect, authorize('admin', 'instructor'), removeStudentFromCourse);

export default router;

