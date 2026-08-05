import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import CourseMaterial from '../models/CourseMaterial.js';
import StudentSubmission from '../models/StudentSubmission.js';
import { canManageCourse } from '../utils/courseAccess.js';
import { notifyManyUsers } from '../services/notificationService.js';

const filePayload = (doc) => ({
  _id: doc._id,
  originalName: doc.originalName,
  mimeType: doc.mimeType,
  size: doc.size,
  moduleOrder: doc.moduleOrder,
  fileUrl: `/uploads/${doc.storedName}`,
  createdAt: doc.createdAt,
  uploadedBy: doc.uploadedBy,
  student: doc.student,
  title: doc.title,
});

/**
 * @desc    Upload instructor learning material for a course
 * @route   POST /api/courses/:courseId/materials
 */
export const uploadCourseMaterial = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to upload for this course' });
    }

    const moduleOrder = req.body.moduleOrder ? Number(req.body.moduleOrder) : null;

    const material = await CourseMaterial.create({
      course: courseId,
      moduleOrder,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    if (course.status === 'published') {
      const enrollments = await Enrollment.find({ course: courseId }).select('student');
      const studentIds = enrollments.map((e) => e.student);
      if (studentIds.length > 0) {
        await notifyManyUsers(studentIds, {
          type: 'announcement',
          title: 'New course material',
          message: `New material "${req.file.originalname}" was added to "${course.title}".`,
          link: `/courses/${courseId}`,
        });
      }
    }

    const populated = await material.populate('uploadedBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Material uploaded',
      data: filePayload(populated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List materials for a course (public for published courses)
 * @route   GET /api/courses/:courseId/materials
 */
export const getCourseMaterials = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (course.status !== 'published' && !canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Course materials are not available' });
    }

    const materials = await CourseMaterial.find({ course: courseId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: materials.length,
      data: materials.map(filePayload),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student submits assignment / project file (must be enrolled)
 * @route   POST /api/courses/:courseId/submissions
 */
export const uploadStudentSubmission = async (req, res, next) => {
  const { courseId } = req.params;
  const title = (req.body.title || '').trim();

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }

    if (!title) {
      return res.status(400).json({ status: 'fail', message: 'Please provide a submission title' });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== 'published') {
      return res.status(404).json({ status: 'fail', message: 'Course not found or not open' });
    }

    const enrolled = await Enrollment.findOne({ course: courseId, student: req.user._id });
    if (!enrolled) {
      return res.status(403).json({ status: 'fail', message: 'You must be enrolled to submit work' });
    }

    const submission = await StudentSubmission.create({
      course: courseId,
      student: req.user._id,
      title,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({
      status: 'success',
      message: 'Submission uploaded',
      data: filePayload(submission),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student's own submissions for a course
 * @route   GET /api/courses/:courseId/submissions/mine
 */
export const getMySubmissions = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const submissions = await StudentSubmission.find({
      course: courseId,
      student: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: submissions.map(filePayload),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Instructor views all student submissions for a course
 * @route   GET /api/courses/:courseId/submissions
 */
export const getCourseSubmissions = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    const submissions = await StudentSubmission.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: submissions.map(filePayload),
    });
  } catch (error) {
    next(error);
  }
};
