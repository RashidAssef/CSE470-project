import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { canManageCourse } from '../utils/courseAccess.js';
import { createNotification, notifyManyUsers } from '../services/notificationService.js';

/**
 * Helper to structure attachment data from uploaded file
 */
const attachmentPayload = (file) => {
  if (!file) return { originalName: '', storedName: '', mimeType: '', size: 0, fileUrl: '' };
  return {
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    fileUrl: `/uploads/${file.filename}`,
  };
};

/**
 * @desc    Create a new assignment for a course
 * @route   POST /api/assignments/course/:courseId
 * @access  Private (Instructor/Admin)
 */
export const createAssignment = async (req, res, next) => {
  const { courseId } = req.params;
  const { title, description, deadline, maxMarks } = req.body;

  try {
    // 1. Basic validation
    if (!title || !description || !deadline) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide assignment title, description, and deadline',
      });
    }

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid deadline date and time',
      });
    }

    const parsedMaxMarks = maxMarks ? Number(maxMarks) : 100;
    if (isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Maximum marks must be a positive number',
      });
    }

    // 2. Check course existence and instructor permission
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to create assignments for this course',
      });
    }

    // 3. Handle optional attachment file
    const attachment = attachmentPayload(req.file);

    // 4. Create assignment document
    const assignment = await Assignment.create({
      course: courseId,
      title: title.trim(),
      description: description.trim(),
      deadline: parsedDeadline,
      maxMarks: parsedMaxMarks,
      attachment,
      createdBy: req.user._id,
    });

    // 5. Notify enrolled students about the new assignment
    if (course.status === 'published') {
      const enrollments = await Enrollment.find({ course: courseId }).select('student');
      const studentIds = enrollments.map((e) => e.student);
      if (studentIds.length > 0) {
        await notifyManyUsers(studentIds, {
          type: 'assignment',
          title: 'New Assignment Created',
          message: `New assignment "${assignment.title}" was added to "${course.title}". Due date: ${parsedDeadline.toLocaleString()}.`,
          link: `/courses/${courseId}`,
        });
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments for a course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private (Enrolled Student, Instructor, Admin)
 */
export const getCourseAssignments = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    // Check authorization: Student must be enrolled; Instructor/Admin must teach or manage
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({ course: courseId, student: req.user._id });
      if (!enrolled) {
        return res.status(403).json({
          status: 'fail',
          message: 'You must be enrolled in this course to view assignments',
        });
      }
    } else if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view assignments for this course',
      });
    }

    const assignments = await Assignment.find({ course: courseId }).sort({ deadline: 1 });

    // If student, attach their submission data for each assignment
    if (req.user.role === 'student') {
      const submissions = await AssignmentSubmission.find({
        course: courseId,
        student: req.user._id,
      });

      const submissionMap = {};
      submissions.forEach((sub) => {
        submissionMap[sub.assignment.toString()] = sub;
      });

      const assignmentsWithSubmissions = assignments.map((ass) => {
        const obj = ass.toObject();
        obj.mySubmission = submissionMap[ass._id.toString()] || null;
        return obj;
      });

      return res.status(200).json({
        status: 'success',
        results: assignmentsWithSubmissions.length,
        data: assignmentsWithSubmissions,
      });
    }

    res.status(200).json({
      status: 'success',
      results: assignments.length,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single assignment details
 * @route   GET /api/assignments/:id
 * @access  Private
 */
export const getAssignmentById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const assignment = await Assignment.findById(id).populate('course', 'title status instructor');
    if (!assignment) {
      return res.status(404).json({ status: 'fail', message: 'Assignment not found' });
    }

    // Check authorization
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        course: assignment.course._id,
        student: req.user._id,
      });
      if (!enrolled) {
        return res.status(403).json({
          status: 'fail',
          message: 'You are not authorized to view this assignment',
        });
      }
    }

    const data = assignment.toObject();

    if (req.user.role === 'student') {
      const mySub = await AssignmentSubmission.findOne({
        assignment: id,
        student: req.user._id,
      });
      data.mySubmission = mySub || null;
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
 * @desc    Update assignment details
 * @route   PUT /api/assignments/:id
 * @access  Private (Instructor/Admin)
 */
export const updateAssignment = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, deadline, maxMarks } = req.body;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ status: 'fail', message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course);
    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to edit this assignment',
      });
    }

    if (title) assignment.title = title.trim();
    if (description) assignment.description = description.trim();
    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ status: 'fail', message: 'Invalid deadline date format' });
      }
      assignment.deadline = parsedDeadline;
    }
    if (maxMarks) {
      const parsedMaxMarks = Number(maxMarks);
      if (isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
        return res.status(400).json({ status: 'fail', message: 'Maximum marks must be a positive number' });
      }
      assignment.maxMarks = parsedMaxMarks;
    }

    if (req.file) {
      assignment.attachment = attachmentPayload(req.file);
    }

    await assignment.save();

    res.status(200).json({
      status: 'success',
      message: 'Assignment updated successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private (Instructor/Admin)
 */
export const deleteAssignment = async (req, res, next) => {
  const { id } = req.params;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ status: 'fail', message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course);
    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this assignment',
      });
    }

    // Remove assignment and all student submissions for it
    await AssignmentSubmission.deleteMany({ assignment: id });
    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Assignment and associated submissions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit assignment work (file or text note)
 * @route   POST /api/assignments/:id/submit
 * @access  Private (Student)
 */
export const submitAssignment = async (req, res, next) => {
  const { id } = req.params;
  const submissionText = (req.body.submissionText || '').trim();

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ status: 'fail', message: 'Assignment not found' });
    }

    // 1. Verify student enrollment in the course
    const enrolled = await Enrollment.findOne({
      course: assignment.course,
      student: req.user._id,
    });

    if (!enrolled) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to submit assignments',
      });
    }

    // 2. Check deadline enforcement
    const now = new Date();
    if (now > new Date(assignment.deadline)) {
      return res.status(400).json({
        status: 'fail',
        message: `Submission deadline has passed (${new Date(assignment.deadline).toLocaleString()}). Submissions are no longer accepted.`,
      });
    }

    // 3. Ensure a file or text content is provided
    if (!req.file && !submissionText) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a file attachment or submission text',
      });
    }

    // 4. Check if student already submitted
    let existingSubmission = await AssignmentSubmission.findOne({
      assignment: id,
      student: req.user._id,
    });

    if (existingSubmission && existingSubmission.status === 'graded') {
      return res.status(400).json({
        status: 'fail',
        message: 'Your submission has already been graded and cannot be modified',
      });
    }

    const fileData = req.file
      ? {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
          fileUrl: `/uploads/${req.file.filename}`,
        }
      : {};

    if (existingSubmission) {
      // Re-submission / update before deadline
      if (req.file) {
        existingSubmission.originalName = fileData.originalName;
        existingSubmission.storedName = fileData.storedName;
        existingSubmission.mimeType = fileData.mimeType;
        existingSubmission.size = fileData.size;
        existingSubmission.fileUrl = fileData.fileUrl;
      }
      if (submissionText) {
        existingSubmission.submissionText = submissionText;
      }
      existingSubmission.submittedAt = now;
      await existingSubmission.save();

      return res.status(200).json({
        status: 'success',
        message: 'Submission updated successfully',
        data: existingSubmission,
      });
    } else {
      // Create new submission
      const newSubmission = await AssignmentSubmission.create({
        assignment: id,
        course: assignment.course,
        student: req.user._id,
        ...fileData,
        submissionText,
        submittedAt: now,
      });

      return res.status(201).json({
        status: 'success',
        message: 'Assignment submitted successfully',
        data: newSubmission,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all student submissions for an assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private (Instructor/Admin)
 */
export const getAssignmentSubmissions = async (req, res, next) => {
  const { id } = req.params;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ status: 'fail', message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course);
    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view submissions for this assignment',
      });
    }

    const submissions = await AssignmentSubmission.find({ assignment: id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: submissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in student's submission for an assignment
 * @route   GET /api/assignments/:id/my-submission
 * @access  Private (Student)
 */
export const getMySubmission = async (req, res, next) => {
  const { id } = req.params;

  try {
    const submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({
        status: 'fail',
        message: 'No submission found for this assignment',
      });
    }

    res.status(200).json({
      status: 'success',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grade a student submission
 * @route   PATCH /api/assignments/submissions/:submissionId/grade
 * @access  Private (Instructor/Admin)
 */
export const gradeSubmission = async (req, res, next) => {
  const { submissionId } = req.params;
  const { marks, feedback } = req.body;

  try {
    const submission = await AssignmentSubmission.findById(submissionId).populate('assignment');
    if (!submission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found' });
    }

    const assignment = submission.assignment;
    const course = await Course.findById(submission.course);

    if (req.user.role !== 'admin' && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to grade submissions for this course',
      });
    }

    const numericMarks = Number(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > assignment.maxMarks) {
      return res.status(400).json({
        status: 'fail',
        message: `Marks must be a number between 0 and ${assignment.maxMarks}`,
      });
    }

    submission.marks = numericMarks;
    submission.feedback = (feedback || '').trim();
    submission.status = 'graded';
    await submission.save();

    // Send notification to the student about their grade
    await createNotification({
      user: submission.student,
      type: 'grade',
      title: 'Assignment Graded',
      message: `Your submission for "${assignment.title}" in "${course.title}" was graded: ${numericMarks}/${assignment.maxMarks}.`,
      link: `/courses/${course._id}`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Submission graded successfully',
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments and submission statuses for logged-in student across all enrolled courses
 * @route   GET /api/assignments/student/my
 * @access  Private (Student)
 */
export const getMyCourseAssignmentsOverview = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
    const courseIds = enrollments.map((e) => e.course);

    if (courseIds.length === 0) {
      return res.status(200).json({ status: 'success', results: 0, data: [] });
    }

    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title category')
      .sort({ deadline: 1 });

    const submissions = await AssignmentSubmission.find({
      student: req.user._id,
      course: { $in: courseIds },
    });

    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    const list = assignments.map((ass) => {
      const obj = ass.toObject();
      obj.mySubmission = submissionMap[ass._id.toString()] || null;
      return obj;
    });

    res.status(200).json({
      status: 'success',
      results: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};
