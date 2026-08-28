import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { canManageCourse } from '../utils/courseAccess.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Recomputes averageRating and reviewCount on the Course document from the
 * actual Review collection. Called after every create/update/delete rather
 * than incrementing counters by hand, since an edited rating changes the
 * average in a way a simple +/-1 counter can't express.
 */
const recalculateCourseRating = async (courseId) => {
  const stats = await Review.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

  await Course.findByIdAndUpdate(courseId, {
    averageRating: Math.round(averageRating * 10) / 10, // round to 1 decimal
    reviewCount,
  });
};

/**
 * @desc    List all reviews for a course, most recent first
 * @route   GET /api/courses/:courseId/reviews
 * @access  Public — reviews help prospective students choose a course
 */
export const getCourseReviews = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const reviews = await Review.find({ course: courseId })
      .populate('student', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update the logged-in student's review for a course
 *          (one review per student per course — resubmitting edits it)
 * @route   POST /api/courses/:courseId/reviews
 * @access  Private/Student — must be enrolled in the course
 */
export const submitReview = async (req, res, next) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        status: 'fail',
        message: 'Only students can leave course reviews',
      });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be a number from 1 to 5',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    const enrolled = await Enrollment.findOne({ course: courseId, student: req.user._id });
    if (!enrolled) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to leave a review',
      });
    }

    const existing = await Review.findOne({ course: courseId, student: req.user._id });
    const isNewReview = !existing;

    let review;
    if (existing) {
      existing.rating = ratingNum;
      existing.comment = (comment || '').trim();
      review = await existing.save();
    } else {
      review = await Review.create({
        course: courseId,
        student: req.user._id,
        rating: ratingNum,
        comment: (comment || '').trim(),
      });
    }

    await recalculateCourseRating(courseId);

    if (isNewReview) {
      const notifyTargets = [course.instructor, ...(course.coInstructors || [])].filter(
        (instructorId) => instructorId.toString() !== req.user._id.toString()
      );
      for (const target of notifyTargets) {
        await createNotification({
          user: target,
          type: 'review',
          title: 'New course review',
          message: `${req.user.name} left a ${ratingNum}-star review on "${course.title}".`,
          link: `/courses/${courseId}`,
        });
      }
    }

    const populatedReview = await review.populate('student', 'name');

    res.status(isNewReview ? 201 : 200).json({
      status: 'success',
      message: isNewReview ? 'Review submitted' : 'Review updated',
      data: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already reviewed this course',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get the logged-in student's own review for a course, if any
 * @route   GET /api/courses/:courseId/reviews/my
 * @access  Private/Student
 */
export const getMyReview = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const review = await Review.findOne({ course: courseId, student: req.user._id });

    res.status(200).json({
      status: 'success',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/courses/:courseId/reviews/:reviewId
 * @access  Private — the review's author, or instructor/co-instructor/admin
 *          of the course (to moderate abusive reviews)
 */
export const deleteReview = async (req, res, next) => {
  const { courseId, reviewId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    const review = await Review.findOne({ _id: reviewId, course: courseId });
    if (!review) {
      return res.status(404).json({ status: 'fail', message: 'Review not found' });
    }

    const isAuthor = review.student.toString() === req.user._id.toString();
    if (!isAuthor && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this review',
      });
    }

    await Review.findByIdAndDelete(reviewId);
    await recalculateCourseRating(courseId);

    res.status(200).json({ status: 'success', message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
