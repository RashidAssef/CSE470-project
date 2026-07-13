import Course from '../models/Course.js';

/**
 * @desc    Get all published courses, with optional filters
 * @route   GET /api/courses?category=&level=&search=
 * @access  Public
 *
 * NOTE FOR THE TEAM: Only GET endpoints live here. Create/update/delete for
 * courses belongs to the Course Creation feature — please add those in a
 * separate controller (or extend this one) rather than duplicating the model.
 */
export const getCourses = async (req, res, next) => {
  try {
    const { category, level, search } = req.query;
    let query = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
      query.level = level;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(query)
      .populate('category', 'name slug')
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single course's details
 * @route   GET /api/courses/:id
 * @access  Public
 */
export const getCourseById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id)
      .populate('category', 'name slug')
      .populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};
