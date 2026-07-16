import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';

/**
 * @desc    Enroll the logged-in student in a course
 * @route   POST /api/enrollments/:courseId
 * @access  Private/Student
 */
export const enrollInCourse = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    // 1. Make sure the course exists and is actually published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        status: 'fail',
        message: 'This course is not currently open for enrollment',
      });
    }

    // 2. Prevent duplicate enrollment
    const alreadyEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (alreadyEnrolled) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already enrolled in this course',
      });
    }

    // 3. Create the enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
    });

    // 4. Keep the course's denormalized enrolledCount in sync
    course.enrolledCount += 1;
    await course.save();

    const populatedEnrollment = await enrollment.populate({
      path: 'course',
      select: 'title thumbnail level price',
      populate: { path: 'category', select: 'name' },
    });

    res.status(201).json({
      status: 'success',
      message: `Successfully enrolled in "${course.title}"`,
      data: populatedEnrollment,
    });
  } catch (error) {
    // Handles the rare race-condition case where the unique index catches
    // a duplicate enrollment that slipped past the check above.
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already enrolled in this course',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all courses the logged-in student is enrolled in
 * @route   GET /api/enrollments/my
 * @access  Private/Student
 */
export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'title description thumbnail level price instructor category',
        populate: [
          { path: 'instructor', select: 'name' },
          { path: 'category', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check whether the logged-in user is enrolled in a specific course
 * @route   GET /api/enrollments/status/:courseId
 * @access  Private
 *
 * Used by the course detail page to decide whether to show "Enroll" or
 * "Go to course" without the client having to fetch and scan the full list.
 */
export const getEnrollmentStatus = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    res.status(200).json({
      status: 'success',
      data: {
        enrolled: !!enrollment,
        enrollmentId: enrollment ? enrollment._id : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unenroll the logged-in student from a course
 * @route   DELETE /api/enrollments/:id
 * @access  Private/Student
 */
export const unenrollFromCourse = async (req, res, next) => {
  const { id } = req.params;

  try {
    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Enrollment not found',
      });
    }

    // Students may only unenroll themselves
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to modify this enrollment',
      });
    }

    await Enrollment.findByIdAndDelete(id);

    // Keep the course's denormalized enrolledCount in sync
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { enrolledCount: -1 },
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully unenrolled from the course',
    });
  } catch (error) {
    next(error);
  }
};
