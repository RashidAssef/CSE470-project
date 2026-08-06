import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { createNotification, notifyManyUsers } from '../services/notificationService.js';
import { canManageCourse } from '../utils/courseAccess.js';

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

    // 5. Notify the student
    await createNotification({
      user: req.user._id,
      type: 'enrollment',
      title: 'Enrollment confirmed',
      message: `You're enrolled in "${course.title}". Head to the course page to get started.`,
      link: `/courses/${course._id}`,
    });

    // Notify the primary instructor and all co-instructors (but not if they are admins)
    const instructorsToNotify = [];
    if (course.instructor) {
      instructorsToNotify.push(course.instructor.toString());
    }
    if (course.coInstructors && course.coInstructors.length > 0) {
      course.coInstructors.forEach((id) => {
        const idStr = id.toString();
        if (!instructorsToNotify.includes(idStr)) {
          instructorsToNotify.push(idStr);
        }
      });
    }
    if (instructorsToNotify.length > 0) {
      await notifyManyUsers(instructorsToNotify, {
        type: 'enrollment',
        title: 'New student enrolled',
        message: `Student "${req.user.name}" has enrolled in your course "${course.title}".`,
        link: `/instructor/courses/${course._id}/manage`,
      });
    }

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
    const course = await Course.findByIdAndUpdate(
      enrollment.course,
      { $inc: { enrolledCount: -1 } },
      { new: true }
    );

    await createNotification({
      user: req.user._id,
      type: 'unenrollment',
      title: 'Unenrolled from course',
      message: `You've been unenrolled from "${course?.title || 'a course'}".`,
      link: '/courses',
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully unenrolled from the course',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students enrolled in a specific course
 * @route   GET /api/enrollments/course/:courseId
 * @access  Private/Admin/Instructor
 */
export const getCourseEnrollments = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view enrollments for this course',
      });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email createdAt')
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
 * @desc    Unenroll a student from a course (Admin/Instructor forced)
 * @route   DELETE /api/enrollments/course/:courseId/student/:studentId
 * @access  Private/Admin/Instructor
 */
export const removeStudentFromCourse = async (req, res, next) => {
  const { courseId, studentId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to manage students for this course',
      });
    }

    const enrollment = await Enrollment.findOne({ course: courseId, student: studentId });

    if (!enrollment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Student is not enrolled in this course',
      });
    }

    await Enrollment.findByIdAndDelete(enrollment._id);

    // Decrement the course's enrolledCount
    course.enrolledCount = Math.max(0, course.enrolledCount - 1);
    await course.save();

    const actor = req.user.role === 'admin' ? 'an administrator' : `instructor "${req.user.name}"`;
    await createNotification({
      user: studentId,
      type: 'unenrollment',
      title: 'Removed from course',
      message: `You've been removed from "${course.title}" by ${actor}.`,
      link: '/courses',
    });

    res.status(200).json({
      status: 'success',
      message: 'Student was successfully removed from the course',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll a student in a course (Admin/Instructor force)
 * @route   POST /api/enrollments/course/:courseId/student/:studentId
 * @access  Private/Admin/Instructor
 */
export const enrollStudentInCourseAdmin = async (req, res, next) => {
  const { courseId, studentId } = req.params;

  try {
    // 1. Make sure the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to manage students for this course',
      });
    }

    // 2. Make sure the student exists and is indeed a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        status: 'fail',
        message: 'Student not found or user is not a student',
      });
    }

    if (student.status !== 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot enroll an inactive or suspended student',
      });
    }

    // 3. Prevent duplicate enrollment
    const alreadyEnrolled = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (alreadyEnrolled) {
      return res.status(400).json({
        status: 'fail',
        message: 'Student is already enrolled in this course',
      });
    }

    // 4. Create the enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: 'active',
    });

    // 5. Keep the course's denormalized enrolledCount in sync
    course.enrolledCount += 1;
    await course.save();

    // 6. Notify the student
    const actor = req.user.role === 'admin' ? 'An administrator' : `Instructor "${req.user.name}"`;
    await createNotification({
      user: studentId,
      type: 'enrollment',
      title: 'Enrolled in a course',
      message: `${actor} enrolled you in "${course.title}".`,
      link: `/courses/${course._id}`,
    });

    const populatedEnrollment = await enrollment.populate({
      path: 'student',
      select: 'name email createdAt',
    });

    res.status(201).json({
      status: 'success',
      message: `Successfully enrolled "${student.name}" in "${course.title}"`,
      data: populatedEnrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Student is already enrolled in this course',
      });
    }
    next(error);
  }
};


/**
 * @desc    Enroll multiple students in a course (Admin force bulk)
 * @route   POST /api/enrollments/course/:courseId/students
 * @access  Private/Admin
 */
export const enrollStudentsInCourseBulkAdmin = async (req, res, next) => {
  const { courseId } = req.params;
  const { studentIds } = req.body;

  try {
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of student IDs to enroll',
      });
    }

    // 1. Make sure the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    let enrolledCount = 0;
    const errors = [];
    const enrollmentsToCreate = [];

    // 2. Process each student
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        errors.push(`Student with ID ${studentId} not found or is not a student`);
        continue;
      }

      if (student.status !== 'active') {
        errors.push(`Student "${student.name}" is not active`);
        continue;
      }

      const alreadyEnrolled = await Enrollment.findOne({
        student: studentId,
        course: courseId,
      });

      if (alreadyEnrolled) {
        errors.push(`Student "${student.name}" is already enrolled`);
        continue;
      }

      enrollmentsToCreate.push({
        student: studentId,
        course: courseId,
        status: 'active',
      });
    }

    if (enrollmentsToCreate.length > 0) {
      // 3. Create all enrollments
      await Enrollment.insertMany(enrollmentsToCreate);

      // 4. Update enrolledCount on the course
      course.enrolledCount += enrollmentsToCreate.length;
      await course.save();
      enrolledCount = enrollmentsToCreate.length;

      // 5. Notify all newly enrolled students in one batch insert
      await notifyManyUsers(
        enrollmentsToCreate.map((e) => e.student),
        {
          type: 'enrollment',
          title: 'Enrolled in a course',
          message: `An administrator enrolled you in "${course.title}".`,
          link: `/courses/${course._id}`,
        }
      );
    }

    res.status(201).json({
      status: 'success',
      message: `Successfully enrolled ${enrolledCount} student(s) in "${course.title}"`,
      data: {
        enrolledCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active students
 * @route   GET /api/enrollments/active-students
 * @access  Private/Admin/Instructor
 */
export const getActiveStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', status: 'active' }).select('name email');
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

