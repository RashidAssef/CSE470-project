import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, restrictTo('instructor', 'admin'), createAnnouncement);

router.route('/:id')
  .delete(protect, restrictTo('instructor', 'admin'), deleteAnnouncement);

export default router;
