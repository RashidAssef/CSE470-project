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
  gradeStudentSubmission,
} from '../controllers/courseFileController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import videoLectureRoutes from './videoLectureRoutes.js';
import announcementRoutes from './announcementRoutes.js';

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
router.get('/instructors/active', protect, getActiveInstructors);
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
router.patch(
  '/:courseId/submissions/:submissionId/grade',
  protect,
  authorize('instructor', 'admin'),
  gradeStudentSubmission
);
router.use('/:courseId/video-lectures', videoLectureRoutes);
router.use('/:courseId/announcements', announcementRoutes);

router.get('/:id', getCourseById);

// ==========================================
// COURSE MANAGEMENT ROUTES (Private)
// ==========================================
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.patch('/:id/instructors', protect, authorize('admin'), updateCourseInstructors);

export default router;
