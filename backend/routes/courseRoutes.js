import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getAllCourse,
    insertCourse,
    deleteCourse,
    updateCourse
} from '../controllers/courseController.js';

import express from 'express';
const router = express.Router();



router.route('/')
    .get(getAllCourse)
    .post(protect, authorize('instructor'),insertCourse)
router.route('/:id')
    .delete(protect, authorize('instructor'),deleteCourse)
    .put(protect,authorize('instructor'), updateCourse)


export default router;