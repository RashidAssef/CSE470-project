import express from 'express';
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublishQuiz,
  getCourseQuizzes,
  getQuizById,
  submitQuizAttempt,
  getAttemptReview,
  getMyQuizAttempts,
  getQuizSubmissionsForInstructor,
} from '../controllers/quizController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==========================================
// COURSE QUIZ LIST & RETRIEVAL
// ==========================================
// Note: Optional authentication handling is in controller, so protect or optional header is accepted
router.get('/course/:courseId', protect, getCourseQuizzes);
router.get('/:id', protect, getQuizById);

// ==========================================
// QUIZ ATTEMPTS & GRADING (Student)
// ==========================================
router.post('/:id/attempt', protect, authorize('student', 'admin'), submitQuizAttempt);
router.get('/:id/attempts/mine', protect, authorize('student', 'admin'), getMyQuizAttempts);
router.get('/attempts/:attemptId/review', protect, getAttemptReview);

// ==========================================
// QUIZ MANAGEMENT & ANALYTICS (Instructor / Admin)
// ==========================================
router.post('/', protect, authorize('instructor', 'admin'), createQuiz);
router.put('/:id', protect, authorize('instructor', 'admin'), updateQuiz);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);
router.patch('/:id/publish', protect, authorize('instructor', 'admin'), togglePublishQuiz);
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), getQuizSubmissionsForInstructor);

export default router;
