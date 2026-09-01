import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, authorize('instructor', 'admin'), createAnnouncement);

router.route('/:id')
  .delete(protect, authorize('instructor', 'admin'), deleteAnnouncement);


export default router;
