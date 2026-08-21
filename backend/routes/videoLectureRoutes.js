import express from 'express';
import {
  getVideoLectures,
  addVideoLecture,
  deleteVideoLecture
} from '../controllers/videoLectureController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Assuming this router could be mounted on /api/courses/:courseId/video-lectures
// and also on /api/video-lectures/

router.route('/')
  .get(protect, getVideoLectures)
  .post(protect, restrictTo('instructor', 'admin'), addVideoLecture);

router.route('/:id')
  .delete(protect, restrictTo('instructor', 'admin'), deleteVideoLecture);

export default router;
