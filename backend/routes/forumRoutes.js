import express from 'express';
import {
  createThread,
  getThreads,
  getThreadById,
  createPost,
  deleteThread,
  deletePost,
} from '../controllers/forumController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// All routes are mounted under /api/courses/:courseId/threads (see courseRoutes.js)
// and require login — access is further checked per-course inside the controller
// (enrolled students, or instructor/co-instructor/admin of that course).
router.get('/', protect, getThreads);
router.post('/', protect, createThread);
router.get('/:threadId', protect, getThreadById);
router.delete('/:threadId', protect, deleteThread);
router.post('/:threadId/posts', protect, createPost);
router.delete('/:threadId/posts/:postId', protect, deletePost);

export default router;
