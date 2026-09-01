import express from 'express';
import {
  getVideoLectures,
  addVideoLecture,
  deleteVideoLecture
} from '../controllers/videoLectureController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Assuming this router could be mounted on /api/courses/:courseId/video-lectures
// and also on /api/video-lectures/

router.route('/')
  .get(protect, getVideoLectures)
  .post(protect, authorize('instructor', 'admin'), addVideoLecture);

router.route('/:id')
  .delete(protect, authorize('instructor', 'admin'), deleteVideoLecture);


export default router;
