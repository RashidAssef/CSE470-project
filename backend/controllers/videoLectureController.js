import VideoLecture from '../models/VideoLecture.js';
import Course from '../models/Course.js';
import { canManageCourse } from '../utils/courseAccess.js';

/**
 * @desc    Get all video lectures for a course
 * @route   GET /api/courses/:courseId/video-lectures
 * @access  Private
 */
export const getVideoLectures = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // We can add enrollment check here in the future
    
    const lectures = await VideoLecture.find({ course: courseId }).sort({ moduleOrder: 1, order: 1 });
    
    res.status(200).json({
      status: 'success',
      results: lectures.length,
      data: lectures,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a video lecture to a course
 * @route   POST /api/courses/:courseId/video-lectures
 * @access  Private/Instructor
 */
export const addVideoLecture = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, videoUrl, duration, moduleOrder, order } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized to manage this course' });
    }

    const lecture = await VideoLecture.create({
      course: courseId,
      title,
      videoUrl,
      duration,
      moduleOrder,
      order,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: lecture,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a video lecture
 * @route   DELETE /api/video-lectures/:id
 * @access  Private/Instructor
 */
export const deleteVideoLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lecture = await VideoLecture.findById(id);

    if (!lecture) {
      return res.status(404).json({ status: 'fail', message: 'Lecture not found' });
    }

    const course = await Course.findById(lecture.course);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    await lecture.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Lecture removed',
    });
  } catch (error) {
    next(error);
  }
};
