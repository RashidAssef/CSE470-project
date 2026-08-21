import Announcement from '../models/Announcement.js';
import Course from '../models/Course.js';
import { canManageCourse } from '../utils/courseAccess.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const announcements = await Announcement.find({ course: courseId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: announcements.length,
      data: announcements,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    const announcement = await Announcement.create({
      course: courseId,
      instructor: req.user._id,
      title,
      content,
    });

    res.status(201).json({
      status: 'success',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ status: 'fail', message: 'Announcement not found' });
    }

    const course = await Course.findById(announcement.course);
    if (!course || !canManageCourse(course, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    await announcement.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Announcement removed',
    });
  } catch (error) {
    next(error);
  }
};
