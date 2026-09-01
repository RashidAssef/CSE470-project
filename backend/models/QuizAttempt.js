import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questionText: {
    type: String,
    default: '',
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'multiple_response', 'true_false', 'short_answer'],
  },
  selectedOptions: [
    {
      type: Number,
    },
  ],
  textAnswer: {
    type: String,
    default: '',
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  maxPoints: {
    type: Number,
    default: 1,
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

quizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 });
quizAttemptSchema.index({ course: 1, student: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
