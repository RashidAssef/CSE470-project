import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  getInstructorCourses,
  updateCourseInstructors,
  getActiveInstructors,
  updateCourseModules,
} from '../controllers/courseController.js';
import {
  uploadCourseMaterial,
  getCourseMaterials,
  uploadStudentSubmission,
  getMySubmissions,
  getCourseSubmissions,
} from '../controllers/courseFileController.js';
import forumRoutes from './forumRoutes.js';
<<<<<<< HEAD
import { getCourseAnalytics } from '../controllers/analyticsController.js';
=======
import reviewRoutes from './reviewRoutes.js';
>>>>>>> a3315611bf1a46122872c216564546ba2e0ab8b1
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

const handleUpload = (handler) => (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: 'fail', message: err.message });
    }
    handler(req, res, next);
  });
};

// ==========================================
// COURSE BROWSING ROUTES (Public)
// ==========================================
router.get('/', getCourses);
router.get('/instructors/active', getActiveInstructors);
router.get('/instructor/my', protect, authorize('instructor'), getInstructorCourses);

// Learning path modules & file uploads (before /:id)
router.put('/:id/modules', protect, authorize('instructor', 'admin'), updateCourseModules);
router.post(
  '/:courseId/materials',
  protect,
  authorize('instructor', 'admin'),
  handleUpload(uploadCourseMaterial)
);
router.get('/:courseId/materials', getCourseMaterials);
router.post(
  '/:courseId/submissions',
  protect,
  authorize('student'),
  handleUpload(uploadStudentSubmission)
);
router.get('/:courseId/submissions/mine', protect, authorize('student'), getMySubmissions);
router.get(
  '/:courseId/submissions',
  protect,
  authorize('instructor', 'admin'),
  getCourseSubmissions
);

// Discussion forum (list/create threads, replies) — see forumRoutes.js.
// mergeParams lets forumRoutes read :courseId from this parent router.
router.use('/:courseId/threads', forumRoutes);

<<<<<<< HEAD
// Analytics for a single course — instructor/co-instructor of that course, or admin.
// Access is checked inside the controller via canManageCourse.
router.get('/:courseId/analytics', protect, getCourseAnalytics);
=======
// Reviews & ratings — see reviewRoutes.js.
router.use('/:courseId/reviews', reviewRoutes);
>>>>>>> a3315611bf1a46122872c216564546ba2e0ab8b1

router.get('/:id', getCourseById);

// ==========================================
// COURSE MANAGEMENT ROUTES (Private)
// ==========================================
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.patch('/:id/instructors', protect, authorize('admin'), updateCourseInstructors);

export default router;
