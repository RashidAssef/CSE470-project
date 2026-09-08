import crypto from 'crypto';
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import { createNotification } from '../services/notificationService.js';
import { generateCertificatePDFStream } from '../utils/certificateGenerator.js';

/**
 * Helper to compute student's quiz passing status for a course
 */
export const evaluateCourseQuizMastery = async (courseId, studentId) => {
  const course = await Course.findById(courseId).select('isCompleted status title instructor').lean();
  const isCourseCompleted = Boolean(course?.isCompleted || course?.status === 'completed');

  const quizzes = await Quiz.find({ course: courseId, isPublished: true }).lean();

  if (quizzes.length === 0) {
    return {
      hasQuizzes: false,
      courseCompleted: isCourseCompleted,
      allQuizzesPassed: false,
      eligible: false,
      totalQuizzes: 0,
      passedQuizzes: 0,
      averageScore: 0,
      quizDetails: [],
    };
  }

  const attempts = await QuizAttempt.find({
    course: courseId,
    student: studentId,
  }).lean();

  let passedCount = 0;
  let totalScoreSum = 0;

  const quizDetails = quizzes.map((q) => {
    const qAttempts = attempts.filter((a) => a.quiz.toString() === q._id.toString());
    const highestScore = qAttempts.reduce(
      (max, a) => (a.percentage > max ? a.percentage : max),
      0
    );
    const hasPassed = qAttempts.some((a) => a.passed);

    if (hasPassed) {
      passedCount += 1;
      totalScoreSum += highestScore;
    }

    return {
      quizId: q._id,
      title: q.title,
      moduleOrder: q.moduleOrder,
      passingScore: q.passingScore,
      isCompleted: Boolean(q.isCompleted),
      attemptsMade: qAttempts.length,
      hasPassed,
      highestScore,
    };
  });

  const allQuizzesPassed = passedCount === quizzes.length;
  const averageScore = passedCount > 0 ? Math.round(totalScoreSum / passedCount) : 0;
  // Certificate requires BOTH: course marked completed by instructor AND student passed all quizzes
  const eligible = isCourseCompleted && allQuizzesPassed;

  return {
    hasQuizzes: true,
    courseCompleted: isCourseCompleted,
    allQuizzesPassed,
    eligible,
    totalQuizzes: quizzes.length,
    passedQuizzes: passedCount,
    averageScore,
    quizDetails,
  };
};

/**
 * When instructor marks course as completed, generate certificates for all students who passed all quizzes
 */
export const generateCertificatesForEligibleStudents = async (courseId) => {
  try {
    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) return;

    const enrollments = await Enrollment.find({ course: courseId, status: { $in: ['active', 'completed'] } });

    for (const enrol of enrollments) {
      const studentId = enrol.student;
      const mastery = await evaluateCourseQuizMastery(courseId, studentId);

      if (mastery.allQuizzesPassed) {
        let cert = await Certificate.findOne({ course: courseId, student: studentId });
        if (!cert) {
          const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
          const year = new Date().getFullYear();
          const certificateId = `CERT-${year}-${randomCode}-${Math.floor(1000 + Math.random() * 9000)}`;
          const instructorName = course.instructor?.name || 'Lead Instructor';

          cert = await Certificate.create({
            student: studentId,
            course: courseId,
            certificateId,
            issueDate: new Date(),
            averageScore: mastery.averageScore,
            quizzesCount: mastery.totalQuizzes,
            instructorName,
            verified: true,
          });

          await Enrollment.findOneAndUpdate(
            { course: courseId, student: studentId },
            { status: 'completed', progress: 100 }
          );

          await createNotification({
            user: studentId,
            type: 'achievement',
            title: '🎓 Certificate of Completion Unlocked!',
            message: `"${course.title}" has been marked as completed by your instructor. Your Certificate of Completion is now available!`,
            link: `/courses/${courseId}`,
          });
        }
      }
    }
  } catch (err) {
    console.error('[Bulk Certificate Generation Error]', err);
  }
};

/**
 * Check if current student has passed all quizzes and earned certificate
 * @route GET /api/certificates/course/:courseId/status
 * @access Private (Student / Admin)
 */
export const checkCourseCertificateEligibility = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      course: courseId,
      student: studentId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to view certificate status',
      });
    }

    const mastery = await evaluateCourseQuizMastery(courseId, studentId);

    // Check if certificate already exists in database
    const existingCert = await Certificate.findOne({
      course: courseId,
      student: studentId,
    }).populate('course', 'title category level');

    res.status(200).json({
      status: 'success',
      data: {
        courseId,
        courseTitle: course.title,
        ...mastery,
        certificate: existingCert || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate or retrieve certificate for student upon passing all quizzes
 * @route POST /api/certificates/course/:courseId/generate
 * @access Private (Student / Admin)
 */
export const generateOrGetCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const student = req.user;

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    // Verify all quizzes are passed
    const mastery = await evaluateCourseQuizMastery(courseId, student._id);

    if (!mastery.hasQuizzes) {
      return res.status(400).json({
        status: 'fail',
        message: 'This course does not have any published quizzes yet.',
      });
    }

    if (!mastery.eligible) {
      let msg = '';
      if (!mastery.courseCompleted) {
        msg = 'The instructor has not marked this course as completed yet. Certificates are generated only after the course is marked as completed by the instructor.';
      } else {
        msg = `You have passed ${mastery.passedQuizzes} of ${mastery.totalQuizzes} quizzes. You must pass all quizzes to earn a certificate.`;
      }
      return res.status(400).json({
        status: 'fail',
        message: msg,
        data: mastery,
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      course: courseId,
      student: student._id,
    }).populate('course', 'title category level instructor');

    if (!certificate) {
      // Generate clean unique credential ID
      const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const year = new Date().getFullYear();
      const certificateId = `CERT-${year}-${randomCode}-${Math.floor(1000 + Math.random() * 9000)}`;

      const instructorName = course.instructor?.name || 'Lead Instructor';

      certificate = await Certificate.create({
        student: student._id,
        course: courseId,
        certificateId,
        issueDate: new Date(),
        averageScore: mastery.averageScore,
        quizzesCount: mastery.totalQuizzes,
        instructorName,
        verified: true,
      });

      // Update enrollment to completed and 100% progress
      await Enrollment.findOneAndUpdate(
        { course: courseId, student: student._id },
        { status: 'completed', progress: 100 },
        { new: true }
      );

      // Create completion notification
      await createNotification({
        user: student._id,
        type: 'achievement',
        title: '🎓 Certificate of Completion Earned!',
        message: `Congratulations! You have passed all ${mastery.totalQuizzes} quizzes in "${course.title}" and earned your official digital certificate.`,
        link: `/courses/${courseId}`,
      });
    }

    res.status(201).json({
      status: 'success',
      data: certificate,
      message: 'Certificate generated successfully!',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Stream a downloadable PDF of the certificate
 * @route GET /api/certificates/course/:courseId/download
 * @access Private (Student / Admin)
 */
export const downloadCertificatePDF = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const student = req.user;

    const course = await Course.findById(courseId).populate('instructor', 'name');
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    // Check certificate eligibility
    const mastery = await evaluateCourseQuizMastery(courseId, student._id);

    if (!mastery.eligible && req.user.role !== 'admin') {
      let msg = '';
      if (!mastery.courseCompleted) {
        msg = 'This course has not been marked as completed by the instructor yet. Certificates are available once the course is completed.';
      } else {
        msg = `You must pass all ${mastery.totalQuizzes} quizzes to download this certificate. Current progress: ${mastery.passedQuizzes}/${mastery.totalQuizzes} passed.`;
      }
      return res.status(403).json({
        status: 'fail',
        message: msg,
      });
    }

    // Ensure Certificate record exists
    let certificate = await Certificate.findOne({
      course: courseId,
      student: student._id,
    });

    if (!certificate) {
      const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const year = new Date().getFullYear();
      const certificateId = `CERT-${year}-${randomCode}-${Math.floor(1000 + Math.random() * 9000)}`;
      const instructorName = course.instructor?.name || 'Lead Instructor';

      certificate = await Certificate.create({
        student: student._id,
        course: courseId,
        certificateId,
        issueDate: new Date(),
        averageScore: mastery.averageScore || 100,
        quizzesCount: mastery.totalQuizzes || 1,
        instructorName,
        verified: true,
      });

      // Mark enrollment completed
      await Enrollment.findOneAndUpdate(
        { course: courseId, student: student._id },
        { status: 'completed', progress: 100 }
      );
    }

    // Format safe file attachment name
    const sanitizedTitle = course.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Certificate_${sanitizedTitle}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateCertificatePDFStream(
      {
        studentName: student.name || 'Valued Student',
        courseTitle: course.title,
        instructorName: certificate.instructorName || course.instructor?.name || 'Instructor',
        certificateId: certificate.certificateId,
        issueDate: certificate.issueDate || new Date(),
        averageScore: certificate.averageScore || mastery.averageScore || 100,
        quizzesCount: certificate.quizzesCount || mastery.totalQuizzes || 1,
      },
      res
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get all certificates earned by the current student
 * @route GET /api/certificates/my-certificates
 * @access Private (Student)
 */
export const getMyCertificates = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const certificates = await Certificate.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'title description category level thumbnail instructor',
        populate: { path: 'instructor', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      data: certificates,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public certificate verification
 * @route GET /api/certificates/verify/:certificateId
 * @access Public
 */
export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({
      certificateId: certificateId.trim().toUpperCase(),
    })
      .populate('student', 'name')
      .populate('course', 'title category level')
      .lean();

    if (!cert) {
      return res.status(404).json({
        status: 'fail',
        message: 'Certificate not found. The provided ID may be invalid or expired.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        certificateId: cert.certificateId,
        studentName: cert.student?.name,
        courseTitle: cert.course?.title,
        category: cert.course?.category?.name,
        level: cert.course?.level,
        issueDate: cert.issueDate,
        averageScore: cert.averageScore,
        quizzesCount: cert.quizzesCount,
        instructorName: cert.instructorName,
        verified: cert.verified,
      },
      message: 'Certificate is authentic and verified.',
    });
  } catch (err) {
    next(err);
  }
};
