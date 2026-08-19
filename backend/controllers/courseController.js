import Course from '../models/Course.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { canManageCourse } from '../utils/courseAccess.js';

/**
 * @desc    Get all published courses, with optional filters
 * @route   GET /api/courses?category=&level=&search=
 * @access  Public
 */
export const getCourses = async (req, res, next) => {
  try {
    const { category, level, search, instructor } = req.query;
    const conditions = [{ status: 'published' }];

    if (category) {
      conditions.push({ category });
    }

    if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
      conditions.push({ level });
    }

    if (instructor) {
      conditions.push({
        $or: [
          { instructor: instructor },
          { coInstructors: instructor }
        ]
      });
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      conditions.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      });
    }

    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const courses = await Course.find(query)
      .populate('category', 'name slug')
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email')
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
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email');

    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    const data = course.toObject();
    if (data.modules?.length) {
      data.modules.sort((a, b) => a.order - b.order);
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private/Instructor/Admin
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, level, price, thumbnail, status, coInstructors } = req.body;

    // 1. Basic validation
    if (!title || !description || !category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide course title, description and category',
      });
    }

    // 2. Validate category existence
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'Selected course category does not exist',
      });
    }

    let instructorId;

    if (req.user.role === 'admin') {
      // Admin invites/assigns an instructor
      const { instructor } = req.body;
      if (!instructor) {
        return res.status(400).json({
          status: 'fail',
          message: 'Admin must assign an instructor to the course',
        });
      }

      const instructorUser = await User.findById(instructor);
      if (!instructorUser) {
        return res.status(404).json({
          status: 'fail',
          message: 'Assigned instructor not found',
        });
      }

      if (instructorUser.role !== 'instructor') {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned user must be an instructor',
        });
      }

      if (instructorUser.status !== 'active') {
        return res.status(400).json({
          status: 'fail',
          message: 'Assigned instructor must be active/approved by admin',
        });
      }

      instructorId = instructorUser._id;
    } else if (req.user.role === 'instructor') {
      // Instructor creates their own course
      if (req.user.status !== 'active') {
        return res.status(403).json({
          status: 'fail',
          message: 'Only approved/active instructors can create courses. Please wait for administrator verification.',
        });
      }
      instructorId = req.user._id;
    } else {
      return res.status(403).json({
        status: 'fail',
        message: 'Unauthorized role to create a course',
      });
    }

    // Validate coInstructors if provided
    let verifiedCoInstructors = [];
    if (coInstructors && Array.isArray(coInstructors)) {
      for (const coId of coInstructors) {
        // Skip if same as primary instructor
        if (coId.toString() === instructorId.toString()) continue;
        if (verifiedCoInstructors.includes(coId)) continue;

        const coUser = await User.findById(coId);
        if (!coUser || coUser.role !== 'instructor' || coUser.status !== 'active') {
          return res.status(400).json({
            status: 'fail',
            message: `Co-instructor with ID ${coId} is not a valid active instructor`,
          });
        }
        verifiedCoInstructors.push(coId);
      }
    }

    // 3. Create the course
    const course = await Course.create({
      title,
      description,
      category,
      instructor: instructorId,
      coInstructors: verifiedCoInstructors,
      level: level || 'beginner',
      price: price || 0,
      thumbnail: thumbnail || '',
      status: status || 'published', // default to published
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('category', 'name slug')
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: populatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all courses created by the logged-in instructor or where they are a co-instructor
 * @route   GET /api/courses/instructor/my
 * @access  Private/Instructor
 */
export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({
      $or: [
        { instructor: req.user._id },
        { coInstructors: req.user._id }
      ]
    })
      .populate('category', 'name slug')
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email')
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
 * @desc    Update a course's instructors list (primary + co-instructors)
 * @route   PATCH /api/courses/:id/instructors
 * @access  Private/Admin
 */
export const updateCourseInstructors = async (req, res, next) => {
  const { id } = req.params;
  const { instructor, coInstructors } = req.body;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    // 1. Validate and update primary instructor if provided
    if (instructor) {
      const primaryUser = await User.findById(instructor);
      if (!primaryUser || primaryUser.role !== 'instructor' || primaryUser.status !== 'active') {
        return res.status(400).json({
          status: 'fail',
          message: 'Selected primary instructor must be a valid active instructor',
        });
      }
      course.instructor = primaryUser._id;
    }

    // 2. Validate and update co-instructors if provided
    if (coInstructors && Array.isArray(coInstructors)) {
      let verifiedCoInstructors = [];
      for (const coId of coInstructors) {
        // Do not add primary instructor as co-instructor
        if (coId.toString() === course.instructor.toString()) continue;
        if (verifiedCoInstructors.includes(coId)) continue;

        const coUser = await User.findById(coId);
        if (!coUser || coUser.role !== 'instructor' || coUser.status !== 'active') {
          return res.status(400).json({
            status: 'fail',
            message: `Co-instructor with ID ${coId} is not a valid active instructor`,
          });
        }
        verifiedCoInstructors.push(coId);
      }
      course.coInstructors = verifiedCoInstructors;
    }

    await course.save();

    const populatedCourse = await Course.findById(id)
      .populate('category', 'name slug')
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Course instructors updated successfully',
      data: populatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active/verified instructors
 * @route   GET /api/courses/instructors/active
 * @access  Private
 */
export const getActiveInstructors = async (req, res, next) => {
  try {
    const instructors = await User.find({ role: 'instructor', status: 'active' })
      .select('name email')
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: instructors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Replace the ordered learning-path modules for a course
 * @route   PUT /api/courses/:id/modules
 * @access  Private/Instructor (owner or co-instructor) or Admin
 */
export const updateCourseModules = async (req, res, next) => {
  const { id } = req.params;
  const { modules } = req.body;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not allowed to edit this course learning path',
      });
    }

    if (!Array.isArray(modules)) {
      return res.status(400).json({
        status: 'fail',
        message: 'modules must be an array',
      });
    }

    const cleaned = modules.map((mod, index) => {
      const title = (mod.title || '').trim();
      if (!title) {
        throw Object.assign(new Error('Each module needs a title'), { statusCode: 400 });
      }
      const order = Number(mod.order) || index + 1;
      return {
        title,
        description: (mod.description || '').trim(),
        order,
      };
    });

    cleaned.sort((a, b) => a.order - b.order);
    course.modules = cleaned;
    await course.save();

    res.status(200).json({
      status: 'success',
      message: 'Learning path modules updated',
      data: course.modules,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ status: 'fail', message: error.message });
    }
    next(error);
  }
};
