import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['multiple_choice', 'multiple_response', 'true_false', 'short_answer'],
    default: 'multiple_choice',
  },
  options: [
    {
      type: String,
      trim: true,
    },
  ],
  // Array of correct option indices (0-based) for MC/MR/TF, or array of acceptable answer strings for short_answer
  correctAnswers: [
    {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  ],
  points: {
    type: Number,
    default: 1,
    min: 0,
  },
  explanation: {
    type: String,
    default: '',
    trim: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Quiz must be associated with a course'],
    },
    moduleOrder: {
      type: Number,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Quiz must have an instructor'],
    },
    timeLimit: {
      type: Number,
      default: 0, // In minutes. 0 means unlimited
      min: 0,
    },
    passingScore: {
      type: Number,
      default: 70, // In percentage (e.g. 70%)
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      default: 0, // 0 means unlimited
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswersAfterSubmission: {
      type: Boolean,
      default: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ course: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
