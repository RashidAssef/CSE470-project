import express from 'express';
import {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmission,
  gradeSubmission,
  getMyCourseAssignmentsOverview,
} from '../controllers/assignmentController.js';
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
// STUDENT OVERVIEW ROUTE
// ==========================================
router.get('/student/my', protect, authorize('student'), getMyCourseAssignmentsOverview);

// ==========================================
// COURSE ASSIGNMENT ROUTES
// ==========================================
router.post(
  '/course/:courseId',
  protect,
  authorize('instructor', 'admin'),
  handleUpload(createAssignment)
);

router.get('/course/:courseId', protect, getCourseAssignments);

// ==========================================
// ASSIGNMENT SPECIFIC ROUTES
// ==========================================
router.get('/:id', protect, getAssignmentById);
router.put('/:id', protect, authorize('instructor', 'admin'), handleUpload(updateAssignment));
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteAssignment);

// ==========================================
// SUBMISSION & GRADING ROUTES
// ==========================================
router.post('/:id/submit', protect, authorize('student'), handleUpload(submitAssignment));
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), getAssignmentSubmissions);
router.get('/:id/my-submission', protect, authorize('student'), getMySubmission);
router.patch('/submissions/:submissionId/grade', protect, authorize('instructor', 'admin'), gradeSubmission);

export default router;
