import express from 'express';
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==========================================
// USER MANAGEMENT ROUTES (Admin-Only)
// ==========================================
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:id/status', protect, authorize('admin'), updateUserStatus);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// ==========================================
// CATEGORY MANAGEMENT ROUTES
// ==========================================
router.route('/categories')
  .get(protect, getCategories) // All authenticated users can view categories (needed for Course Creation / Browse)
  .post(protect, authorize('admin'), createCategory); // Only admin can create

router.route('/categories/:id')
  .put(protect, authorize('admin'), updateCategory)   // Only admin can update
  .delete(protect, authorize('admin'), deleteCategory); // Only admin can delete

export default router;
