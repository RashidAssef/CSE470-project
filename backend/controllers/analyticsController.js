import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import DiscussionThread from '../models/DiscussionThread.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { canManageCourse } from '../utils/courseAccess.js';

/**
 * ==========================================================================
 * NOTE FOR THE TEAM
 * ==========================================================================
 * This controller deliberately does NOT import the Review model. Reviews
 * & Ratings (a separate feature/branch) may or may not be merged yet at any
 * given time — keeping Analytics independent of it means these two features
 * can be merged in either order without one breaking the other's imports.
 * If/when Reviews is merged, average-rating stats can be added here safely
 * as an additive follow-up.
 * ==========================================================================
 */

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Builds an array of the last `count` "YYYY-MM" keys, oldest first. */
const lastNMonthKeys = (count) => {
  const keys = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
};

/** Fills a sparse {monthKey: count} map into an ordered array for charting. */
const fillMonthlySeries = (countsByMonth, months = 6) => {
  return lastNMonthKeys(months).map((key) => ({
    month: key,
    count: countsByMonth[key] || 0,
  }));
};

/**
 * @desc    Analytics across every course the logged-in instructor teaches
 *          (as primary instructor or co-instructor)
 * @route   GET /api/analytics/instructor
 * @access  Private/Instructor
 */
export const getInstructorAnalytics = async (req, res, next) => {
  try {
    const courses = await Course.find({
      $or: [{ instructor: req.user._id }, { coInstructors: req.user._id }],
    })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          totalCourses: 0,
          totalStudents: 0,
          totalEnrollments: 0,
          enrollmentTrend: fillMonthlySeries({}),
          courses: [],
        },
      });
    }

    // Distinct students across all of this instructor's courses
    const distinctStudents = await Enrollment.distinct('student', {
      course: { $in: courseIds },
    });

    const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });

    // Enrollment trend, last 6 months, across all their courses
    const enrollmentDocs = await Enrollment.find({ course: { $in: courseIds } }).select(
      'createdAt'
    );
    const enrollmentCounts = {};
    for (const doc of enrollmentDocs) {
      const key = monthKey(doc.createdAt);
      enrollmentCounts[key] = (enrollmentCounts[key] || 0) + 1;
    }

    // Quiz performance per course
    const quizStats = await QuizAttempt.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$course',
          avgScore: { $avg: '$percentage' },
          attempts: { $sum: 1 },
          passed: { $sum: { $cond: ['$passed', 1, 0] } },
        },
      },
    ]);
    const quizStatsByCourse = Object.fromEntries(
      quizStats.map((s) => [
        s._id.toString(),
        {
          avgScore: Math.round(s.avgScore * 10) / 10,
          attempts: s.attempts,
          passRate: s.attempts ? Math.round((s.passed / s.attempts) * 100) : 0,
        },
      ])
    );

    // Assignment submissions per course
    const assignmentStats = await AssignmentSubmission.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$course',
          submissions: { $sum: 1 },
          graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
        },
      },
    ]);
    const assignmentStatsByCourse = Object.fromEntries(
      assignmentStats.map((s) => [s._id.toString(), s])
    );

    // Forum activity per course
    const forumStats = await DiscussionThread.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', threads: { $sum: 1 }, posts: { $sum: '$postCount' } } },
    ]);
    const forumStatsByCourse = Object.fromEntries(forumStats.map((s) => [s._id.toString(), s]));

    const courseBreakdown = courses.map((course) => {
      const id = course._id.toString();
      const quiz = quizStatsByCourse[id] || { avgScore: 0, attempts: 0, passRate: 0 };
      const assignment = assignmentStatsByCourse[id] || { submissions: 0, graded: 0 };
      const forum = forumStatsByCourse[id] || { threads: 0, posts: 0 };

      return {
        courseId: course._id,
        title: course.title,
        category: course.category?.name || 'General',
        status: course.status,
        enrolledCount: course.enrolledCount,
        avgQuizScore: quiz.avgScore,
        quizAttempts: quiz.attempts,
        quizPassRate: quiz.passRate,
        assignmentSubmissions: assignment.submissions,
        assignmentGraded: assignment.graded,
        forumThreads: forum.threads,
        forumPosts: forum.posts,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalCourses: courses.length,
        totalStudents: distinctStudents.length,
        totalEnrollments,
        enrollmentTrend: fillMonthlySeries(enrollmentCounts),
        courses: courseBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Detailed analytics for a single course
 * @route   GET /api/courses/:courseId/analytics
 * @access  Private — instructor/co-instructor of the course, or admin
 */
export const getCourseAnalytics = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view analytics for this course',
      });
    }

    // Enrollment trend, last 6 months
    const enrollmentDocs = await Enrollment.find({ course: courseId }).select('createdAt');
    const enrollmentCounts = {};
    for (const doc of enrollmentDocs) {
      const key = monthKey(doc.createdAt);
      enrollmentCounts[key] = (enrollmentCounts[key] || 0) + 1;
    }

    // Per-quiz performance
    const quizzes = await Quiz.find({ course: courseId }).select('title questions');
    const quizPerformance = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await QuizAttempt.find({ quiz: quiz._id }).select('percentage passed');
        const attemptCount = attempts.length;
        const avgScore = attemptCount
          ? Math.round(
              (attempts.reduce((sum, a) => sum + a.percentage, 0) / attemptCount) * 10
            ) / 10
          : 0;
        const passRate = attemptCount
          ? Math.round((attempts.filter((a) => a.passed).length / attemptCount) * 100)
          : 0;

        return {
          quizId: quiz._id,
          title: quiz.title,
          questionCount: quiz.questions.length,
          attempts: attemptCount,
          avgScore,
          passRate,
        };
      })
    );

    // Per-assignment submission stats
    const assignments = await Assignment.find({ course: courseId }).select('title maxMarks');
    const assignmentPerformance = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await AssignmentSubmission.find({
          assignment: assignment._id,
        }).select('marks status');
        const gradedSubmissions = submissions.filter((s) => s.status === 'graded' && s.marks != null);
        const avgMarks = gradedSubmissions.length
          ? Math.round(
              (gradedSubmissions.reduce((sum, s) => sum + s.marks, 0) / gradedSubmissions.length) * 10
            ) / 10
          : 0;

        return {
          assignmentId: assignment._id,
          title: assignment.title,
          maxMarks: assignment.maxMarks,
          submissions: submissions.length,
          graded: gradedSubmissions.length,
          avgMarks,
        };
      })
    );

    // Engagement: forum activity + how many enrolled students have participated in anything
    const threadCount = await DiscussionThread.countDocuments({ course: courseId });
    const postCount = await Post.countDocuments({ course: courseId });

    const [quizParticipants, assignmentParticipants, forumParticipants] = await Promise.all([
      QuizAttempt.distinct('student', { course: courseId }),
      AssignmentSubmission.distinct('student', { course: courseId }),
      Post.distinct('author', { course: courseId }),
    ]);
    const engagedStudentIds = new Set(
      [...quizParticipants, ...assignmentParticipants, ...forumParticipants].map((id) =>
        id.toString()
      )
    );

    res.status(200).json({
      status: 'success',
      data: {
        title: course.title,
        enrolledCount: course.enrolledCount,
        engagedStudents: engagedStudentIds.size,
        engagementRate: course.enrolledCount
          ? Math.round((engagedStudentIds.size / course.enrolledCount) * 100)
          : 0,
        enrollmentTrend: fillMonthlySeries(enrollmentCounts),
        quizzes: quizPerformance,
        assignments: assignmentPerformance,
        forum: { threads: threadCount, posts: postCount },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Platform-wide analytics
 * @route   GET /api/analytics/admin
 * @access  Private/Admin
 */
export const getAdminAnalytics = async (req, res, next) => {
  try {
    const [usersByRole, coursesByStatus, totalEnrollments, pendingInstructors] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Course.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Enrollment.countDocuments(),
      User.countDocuments({ role: 'instructor', status: 'pending' }),
    ]);

    const usersByRoleMap = Object.fromEntries(usersByRole.map((r) => [r._id, r.count]));
    const coursesByStatusMap = Object.fromEntries(coursesByStatus.map((c) => [c._id, c.count]));

    // Signup trend, last 6 months
    const users = await User.find().select('createdAt');
    const signupCounts = {};
    for (const user of users) {
      const key = monthKey(user.createdAt);
      signupCounts[key] = (signupCounts[key] || 0) + 1;
    }

    // Top categories by number of courses
    const categoryCounts = await Course.aggregate([
      { $group: { _id: '$category', courseCount: { $sum: 1 }, totalEnrollments: { $sum: '$enrolledCount' } } },
      { $sort: { totalEnrollments: -1 } },
      { $limit: 5 },
    ]);
    const categoryIds = categoryCounts.map((c) => c._id).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }).select('name');
    const categoryNameMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));
    const topCategories = categoryCounts.map((c) => ({
      category: c._id ? categoryNameMap[c._id.toString()] || 'Unknown' : 'Uncategorized',
      courseCount: c.courseCount,
      totalEnrollments: c.totalEnrollments,
    }));

    // Top courses by enrollment
    const topCourses = await Course.find({ status: 'published' })
      .sort({ enrolledCount: -1 })
      .limit(5)
      .select('title enrolledCount')
      .populate('instructor', 'name');

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers: users.length,
        usersByRole: {
          student: usersByRoleMap.student || 0,
          instructor: usersByRoleMap.instructor || 0,
          admin: usersByRoleMap.admin || 0,
        },
        totalCourses: (coursesByStatusMap.published || 0) + (coursesByStatusMap.draft || 0),
        coursesByStatus: {
          published: coursesByStatusMap.published || 0,
          draft: coursesByStatusMap.draft || 0,
        },
        totalEnrollments,
        pendingInstructorApprovals: pendingInstructors,
        signupTrend: fillMonthlySeries(signupCounts),
        topCategories,
        topCourses: topCourses.map((c) => ({
          courseId: c._id,
          title: c.title,
          instructor: c.instructor?.name || 'Unknown',
          enrolledCount: c.enrolledCount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
