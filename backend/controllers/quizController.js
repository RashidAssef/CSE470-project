import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import { createNotification, notifyManyUsers } from '../services/notificationService.js';
import { evaluateCourseQuizMastery } from './certificateController.js';

// ==========================================
// QUIZ MANAGEMENT (Instructor / Admin)
// ==========================================

/**
 * Create a new quiz for a course
 * @route POST /api/quizzes
 * @access Private (Instructor / Admin)
 */
export const createQuiz = async (req, res, next) => {
  try {
    const {
      courseId,
      moduleOrder,
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      showCorrectAnswersAfterSubmission,
      questions,
    } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({
        status: 'fail',
        message: 'Course ID and Quiz title are required',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    // Authorization check
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((id) => id.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to add quizzes to this course',
      });
    }

    const quiz = await Quiz.create({
      course: courseId,
      moduleOrder: moduleOrder !== undefined ? moduleOrder : null,
      title,
      description: description || '',
      instructor: req.user._id,
      timeLimit: Number(timeLimit) || 0,
      passingScore: Number(passingScore) || 70,
      maxAttempts: Number(maxAttempts) || 0,
      shuffleQuestions: Boolean(shuffleQuestions),
      showCorrectAnswersAfterSubmission: showCorrectAnswersAfterSubmission !== undefined ? Boolean(showCorrectAnswersAfterSubmission) : true,
      questions: questions || [],
    });

    res.status(201).json({
      status: 'success',
      data: quiz,
      message: 'Quiz created successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update quiz details and questions
 * @route PUT /api/quizzes/:id
 * @access Private (Instructor / Admin)
 */
export const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((id) => id.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this quiz',
      });
    }

    const {
      moduleOrder,
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      isPublished,
      shuffleQuestions,
      showCorrectAnswersAfterSubmission,
      questions,
    } = req.body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (moduleOrder !== undefined) quiz.moduleOrder = moduleOrder;
    if (timeLimit !== undefined) quiz.timeLimit = Number(timeLimit);
    if (passingScore !== undefined) quiz.passingScore = Number(passingScore);
    if (maxAttempts !== undefined) quiz.maxAttempts = Number(maxAttempts);
    if (isPublished !== undefined) quiz.isPublished = Boolean(isPublished);
    if (shuffleQuestions !== undefined) quiz.shuffleQuestions = Boolean(shuffleQuestions);
    if (showCorrectAnswersAfterSubmission !== undefined) {
      quiz.showCorrectAnswersAfterSubmission = Boolean(showCorrectAnswersAfterSubmission);
    }
    if (questions !== undefined) quiz.questions = questions;

    await quiz.save();

    res.status(200).json({
      status: 'success',
      data: quiz,
      message: 'Quiz updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a quiz
 * @route DELETE /api/quizzes/:id
 * @access Private (Instructor / Admin)
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((id) => id.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this quiz',
      });
    }

    await QuizAttempt.deleteMany({ quiz: id });
    await Quiz.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Quiz and all associated student attempts deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle publish status of a quiz
 * @route PATCH /api/quizzes/:id/publish
 * @access Private (Instructor / Admin)
 */
export const togglePublishQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((id) => id.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to manage this quiz',
      });
    }

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();

    // If just published, notify all active enrolled students
    if (quiz.isPublished) {
      const activeEnrollments = await Enrollment.find({
        course: quiz.course._id,
        status: 'active',
      }).select('student');

      if (activeEnrollments.length > 0) {
        const studentIds = activeEnrollments.map((e) => e.student);
        await notifyManyUsers(studentIds, {
          type: 'quiz',
          title: `New Quiz: ${quiz.title}`,
          message: `A new assessment "${quiz.title}" has been published in "${course.title}".`,
          link: `/courses/${course._id}`,
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: quiz,
      message: `Quiz is now ${quiz.isPublished ? 'published' : 'saved as draft'}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle completed status of a quiz (mark quiz completed/active)
 * @route PATCH /api/quizzes/:id/complete
 * @access Private (Instructor / Admin)
 */
export const toggleCompleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((cId) => cId.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to manage this quiz',
      });
    }

    quiz.isCompleted = !quiz.isCompleted;
    await quiz.save();

    res.status(200).json({
      status: 'success',
      data: quiz,
      message: `Quiz marked as ${quiz.isCompleted ? 'completed' : 'active'}`,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QUIZ VIEWING & RETRIEVAL
// ==========================================

/**
 * Get all quizzes for a course
 * @route GET /api/quizzes/course/:courseId
 * @access Public / Authenticated
 */
export const getCourseQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'fail',
        message: 'Course not found',
      });
    }

    const isInstructorOrAdmin =
      user &&
      (user.role === 'admin' ||
        course.instructor.toString() === user._id.toString() ||
        (course.coInstructors &&
          course.coInstructors.some((id) => id.toString() === user._id.toString())));

    let query = { course: courseId };
    if (!isInstructorOrAdmin) {
      // Students and public only see published quizzes
      query.isPublished = true;
    }

    const quizzes = await Quiz.find(query)
      .sort({ moduleOrder: 1, createdAt: 1 })
      .lean();

    // If student or public, strip correct answers and explanations from list
    const sanitizedQuizzes = quizzes.map((q) => {
      const totalPoints = (q.questions || []).reduce((sum, item) => sum + (item.points || 1), 0);
      const questionCount = (q.questions || []).length;

      if (isInstructorOrAdmin) {
        return { ...q, totalPoints, questionCount };
      }

      // Sanitize questions
      const sanitizedQuestions = (q.questions || []).map((quest) => ({
        _id: quest._id,
        questionText: quest.questionText,
        questionType: quest.questionType,
        options: quest.options,
        points: quest.points,
      }));

      return {
        _id: q._id,
        course: q.course,
        moduleOrder: q.moduleOrder,
        title: q.title,
        description: q.description,
        timeLimit: q.timeLimit,
        passingScore: q.passingScore,
        maxAttempts: q.maxAttempts,
        isPublished: q.isPublished,
        isCompleted: Boolean(q.isCompleted),
        shuffleQuestions: q.shuffleQuestions,
        showCorrectAnswersAfterSubmission: q.showCorrectAnswersAfterSubmission,
        questionCount,
        totalPoints,
        questions: sanitizedQuestions,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      };
    });

    // If user is a student, also attach their best attempt / latest attempt summary
    if (user && user.role === 'student') {
      const attempts = await QuizAttempt.find({
        course: courseId,
        student: user._id,
      })
        .sort({ attemptNumber: -1 })
        .lean();

      const quizzesWithAttempts = sanitizedQuizzes.map((quiz) => {
        const quizAttempts = attempts.filter((a) => a.quiz.toString() === quiz._id.toString());
        const totalAttemptsMade = quizAttempts.length;
        const latestAttempt = quizAttempts[0] || null;
        const highestScore = quizAttempts.reduce(
          (max, a) => (a.percentage > max ? a.percentage : max),
          0
        );
        const hasPassed = quizAttempts.some((a) => a.passed);

        return {
          ...quiz,
          totalAttemptsMade,
          hasPassed,
          highestScore,
          latestAttempt: latestAttempt
            ? {
                _id: latestAttempt._id,
                attemptNumber: latestAttempt.attemptNumber,
                percentage: latestAttempt.percentage,
                passed: latestAttempt.passed,
                submittedAt: latestAttempt.submittedAt,
              }
            : null,
        };
      });

      return res.status(200).json({
        status: 'success',
        data: quizzesWithAttempts,
      });
    }

    res.status(200).json({
      status: 'success',
      data: sanitizedQuizzes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single quiz by ID (for taking or editing)
 * @route GET /api/quizzes/:id
 * @access Private
 */
export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const quiz = await Quiz.findById(id).populate('course').lean();
    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructorOrAdmin =
      user.role === 'admin' ||
      course.instructor.toString() === user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((cId) => cId.toString() === user._id.toString()));

    if (!isInstructorOrAdmin) {
      if (!quiz.isPublished) {
        return res.status(403).json({
          status: 'fail',
          message: 'This quiz has not been published yet',
        });
      }

      // Check enrollment
      const enrollment = await Enrollment.findOne({
        course: course._id,
        student: user._id,
        status: 'active',
      });

      if (!enrollment) {
        return res.status(403).json({
          status: 'fail',
          message: 'You must be enrolled in this course to take this quiz',
        });
      }

      // Sanitize questions (remove correct answers & explanations)
      let questions = (quiz.questions || []).map((quest) => ({
        _id: quest._id,
        questionText: quest.questionText,
        questionType: quest.questionType,
        options: quest.options,
        points: quest.points,
      }));

      // Shuffle if enabled
      if (quiz.shuffleQuestions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }

      const totalPoints = (quiz.questions || []).reduce(
        (sum, item) => sum + (item.points || 1),
        0
      );

      // Fetch user's previous attempt count
      const attemptCount = await QuizAttempt.countDocuments({
        quiz: id,
        student: user._id,
      });

      return res.status(200).json({
        status: 'success',
        data: {
          _id: quiz._id,
          course: {
            _id: course._id,
            title: course.title,
          },
          moduleOrder: quiz.moduleOrder,
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
          totalPoints,
          attemptsMade: attemptCount,
          questions,
        },
      });
    }

    // Instructor / Admin gets full data with correct answers & explanations
    res.status(200).json({
      status: 'success',
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QUIZ ATTEMPT & GRADING (Student)
// ==========================================

/**
 * Submit quiz answers and calculate grade
 * @route POST /api/quizzes/:id/attempt
 * @access Private (Student)
 */
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers = [], timeSpentSeconds = 0 } = req.body;
    const studentId = req.user._id;

    const quiz = await Quiz.findById(id).populate('course');
    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    if (!quiz.isPublished) {
      return res.status(403).json({
        status: 'fail',
        message: 'Cannot submit an attempt for an unpublished quiz',
      });
    }

    // Verify student is actively enrolled
    const enrollment = await Enrollment.findOne({
      course: quiz.course._id,
      student: studentId,
      status: 'active',
    });

    if (!enrollment && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to take this quiz',
      });
    }

    // Check attempt limits
    const previousAttempts = await QuizAttempt.find({
      quiz: id,
      student: studentId,
    });

    if (quiz.maxAttempts > 0 && previousAttempts.length >= quiz.maxAttempts) {
      return res.status(400).json({
        status: 'fail',
        message: `Maximum attempt limit (${quiz.maxAttempts}) reached for this quiz`,
      });
    }

    const currentAttemptNumber = previousAttempts.length + 1;

    // Perform Automatic Grading
    let totalScore = 0;
    let totalPossiblePoints = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((q) => {
      const qPoints = q.points || 1;
      totalPossiblePoints += qPoints;

      // Find student answer for this question
      const studentAns = answers.find(
        (a) => a.questionId && a.questionId.toString() === q._id.toString()
      );

      let isCorrect = false;
      let pointsAwarded = 0;
      let selectedOptions = [];
      let textAnswer = '';

      if (studentAns) {
        selectedOptions = Array.isArray(studentAns.selectedOptions)
          ? studentAns.selectedOptions.map(Number)
          : [];
        textAnswer = typeof studentAns.textAnswer === 'string' ? studentAns.textAnswer.trim() : '';

        if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
          const correctIdx = Number(q.correctAnswers[0]);
          if (selectedOptions.length === 1 && selectedOptions[0] === correctIdx) {
            isCorrect = true;
          }
        } else if (q.questionType === 'multiple_response') {
          const correctIndices = (q.correctAnswers || []).map(Number).sort((a, b) => a - b);
          const studentIndices = [...selectedOptions].sort((a, b) => a - b);

          if (
            correctIndices.length === studentIndices.length &&
            correctIndices.every((val, idx) => val === studentIndices[idx])
          ) {
            isCorrect = true;
          }
        } else if (q.questionType === 'short_answer') {
          const studentText = textAnswer.toLowerCase();
          const matches = (q.correctAnswers || []).some(
            (c) => c.toString().trim().toLowerCase() === studentText
          );
          if (matches && studentText.length > 0) {
            isCorrect = true;
          }
        }
      }

      if (isCorrect) {
        pointsAwarded = qPoints;
        totalScore += qPoints;
      }

      gradedAnswers.push({
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        selectedOptions,
        textAnswer,
        isCorrect,
        pointsAwarded,
        maxPoints: qPoints,
      });
    });

    const percentage =
      totalPossiblePoints > 0 ? Math.round((totalScore / totalPossiblePoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      quiz: id,
      course: quiz.course._id,
      student: studentId,
      attemptNumber: currentAttemptNumber,
      answers: gradedAnswers,
      score: totalScore,
      totalPoints: totalPossiblePoints,
      percentage,
      passed,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      startedAt: new Date(Date.now() - (Number(timeSpentSeconds) || 0) * 1000),
      submittedAt: new Date(),
    });

    // Notify the student about the quiz outcome
    await createNotification({
      user: studentId,
      type: 'quiz',
      title: `Quiz Result: ${quiz.title}`,
      message: `You scored ${percentage}% (${totalScore}/${totalPossiblePoints} pts) on "${quiz.title}" — Status: ${
        passed ? 'PASSED' : 'NOT PASSED'
      }.`,
      link: `/courses/${quiz.course._id}`,
    });

    // Check if student has now passed all quizzes in this course and qualified for a certificate
    let certificateEarned = false;
    let certificateId = null;

    if (passed) {
      try {
        const mastery = await evaluateCourseQuizMastery(quiz.course._id, studentId);
        if (mastery.eligible) {
          certificateEarned = true;
          let cert = await Certificate.findOne({
            course: quiz.course._id,
            student: studentId,
          });

          if (!cert) {
            const cryptoModule = await import('crypto');
            const randomCode = cryptoModule.default.randomBytes(3).toString('hex').toUpperCase();
            const year = new Date().getFullYear();
            const newCertId = `CERT-${year}-${randomCode}-${Math.floor(1000 + Math.random() * 9000)}`;
            const instructorName = quiz.course.instructor?.name || 'Lead Instructor';

            cert = await Certificate.create({
              student: studentId,
              course: quiz.course._id,
              certificateId: newCertId,
              issueDate: new Date(),
              averageScore: mastery.averageScore,
              quizzesCount: mastery.totalQuizzes,
              instructorName,
              verified: true,
            });

            await Enrollment.findOneAndUpdate(
              { course: quiz.course._id, student: studentId },
              { status: 'completed', progress: 100 }
            );

            await createNotification({
              user: studentId,
              type: 'achievement',
              title: '🎓 Certificate of Completion Earned!',
              message: `Congratulations! You have passed all ${mastery.totalQuizzes} quizzes in "${quiz.course.title}" and earned your Certificate of Completion!`,
              link: `/courses/${quiz.course._id}`,
            });
          }

          certificateId = cert.certificateId;
        }
      } catch (certErr) {
        console.error('[Certificate Check Error]', certErr);
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        attemptId: attempt._id,
        quizId: quiz._id,
        title: quiz.title,
        attemptNumber: attempt.attemptNumber,
        score: totalScore,
        totalPoints: totalPossiblePoints,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        timeSpentSeconds: attempt.timeSpentSeconds,
        showReview: quiz.showCorrectAnswersAfterSubmission,
        certificateEarned,
        certificateId,
      },
      message: `Quiz completed. Your score: ${percentage}%`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get detailed attempt review with answers, correct answers and explanations
 * @route GET /api/quizzes/attempts/:attemptId/review
 * @access Private (Student who submitted, or Instructor/Admin)
 */
export const getAttemptReview = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const user = req.user;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quiz')
      .populate('course')
      .populate('student', 'name email');

    if (!attempt) {
      return res.status(404).json({
        status: 'fail',
        message: 'Attempt not found',
      });
    }

    const isStudentOwner = attempt.student._id.toString() === user._id.toString();
    const course = attempt.course;
    const isInstructorOrAdmin =
      user.role === 'admin' ||
      course.instructor.toString() === user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((id) => id.toString() === user._id.toString()));

    if (!isStudentOwner && !isInstructorOrAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view this quiz review',
      });
    }

    const quiz = attempt.quiz;

    // Build question-by-question review
    const questionReview = (attempt.answers || []).map((ans) => {
      const originalQuestion = (quiz.questions || []).find(
        (q) => q._id.toString() === ans.questionId.toString()
      );

      const showAnswers = isInstructorOrAdmin || quiz.showCorrectAnswersAfterSubmission;

      return {
        questionId: ans.questionId,
        questionText: ans.questionText || (originalQuestion ? originalQuestion.questionText : ''),
        questionType: ans.questionType || (originalQuestion ? originalQuestion.questionType : 'multiple_choice'),
        options: originalQuestion ? originalQuestion.options : [],
        selectedOptions: ans.selectedOptions,
        textAnswer: ans.textAnswer,
        isCorrect: ans.isCorrect,
        pointsAwarded: ans.pointsAwarded,
        maxPoints: ans.maxPoints,
        correctAnswers: showAnswers && originalQuestion ? originalQuestion.correctAnswers : undefined,
        explanation: showAnswers && originalQuestion ? originalQuestion.explanation : '',
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        _id: attempt._id,
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
        },
        student: {
          _id: attempt.student._id,
          name: attempt.student.name,
          email: attempt.student.email,
        },
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        percentage: attempt.percentage,
        passed: attempt.passed,
        timeSpentSeconds: attempt.timeSpentSeconds,
        submittedAt: attempt.submittedAt,
        questions: questionReview,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all attempts made by current student for a quiz
 * @route GET /api/quizzes/:id/attempts/mine
 * @access Private (Student)
 */
export const getMyQuizAttempts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const attempts = await QuizAttempt.find({
      quiz: id,
      student: studentId,
    })
      .sort({ attemptNumber: -1 })
      .select('-answers')
      .lean();

    res.status(200).json({
      status: 'success',
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all student submissions & analytics for a quiz
 * @route GET /api/quizzes/:id/submissions
 * @access Private (Instructor / Admin)
 */
export const getQuizSubmissionsForInstructor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('course');

    if (!quiz) {
      return res.status(404).json({
        status: 'fail',
        message: 'Quiz not found',
      });
    }

    const course = quiz.course;
    const isInstructor =
      course.instructor.toString() === req.user._id.toString() ||
      (course.coInstructors &&
        course.coInstructors.some((cId) => cId.toString() === req.user._id.toString()));

    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view submissions for this quiz',
      });
    }

    const attempts = await QuizAttempt.find({ quiz: id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    // Compute metrics
    const totalAttempts = attempts.length;
    const uniqueStudents = new Set(attempts.map((a) => a.student?._id?.toString())).size;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const averageScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
        : 0;

    res.status(200).json({
      status: 'success',
      data: {
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
          questionCount: (quiz.questions || []).length,
        },
        analytics: {
          totalAttempts,
          uniqueStudents,
          passRate,
          averageScore,
        },
        submissions: attempts,
      },
    });
  } catch (err) {
    next(err);
  }
};
