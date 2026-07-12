import User from '../models/User.js';
import Category from '../models/Category.js';

// ==========================================
// USER MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Get all users (with optional query filters)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    let query = {};

    // Apply role filtering
    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      query.role = role;
    }

    // Apply status filtering
    if (status && ['pending', 'active', 'suspended'].includes(status)) {
      query.status = status;
    }

    // Apply search filter (matches name or email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Retrieve users excluding password, sort by newest
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's account status (e.g. approve instructors, suspend students)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // 1. Validate status input
    if (!status || !['pending', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid account status (pending, active, suspended)'
      });
    }

    // 2. Prevent an admin from updating their own status
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admins cannot modify their own account status'
      });
    }

    // 3. Find and update user status
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User '${user.name}' status updated to '${status}' successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Prevent self-deletion
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admins cannot delete their own account'
      });
    }

    // 2. Find and remove user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found'
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: `User '${user.name}' was successfully removed from the system`
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CATEGORY MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Create a new course category
 * @route   POST /api/admin/categories
 * @access  Private/Admin
 */
export const createCategory = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    // 1. Validate fields
    if (!name || !description) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide both category name and description'
      });
    }

    // 2. Check if category already exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'A category with this name already exists'
      });
    }

    // 3. Create category
    const category = await Category.create({
      name,
      description,
      createdBy: req.user._id // Admin ID from protect middleware
    });

    res.status(201).json({
      status: 'success',
      message: 'New course category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/admin/categories (or GET /api/categories)
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate('createdBy', 'name email').sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a course category
 * @route   PUT /api/admin/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found'
      });
    }

    // Update fields if provided
    if (name) category.name = name;
    if (description) category.description = description;

    // Trigger category.save() so the pre-save hook re-generates the URL slug
    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a course category
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Category not found'
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: `Category '${category.name}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
