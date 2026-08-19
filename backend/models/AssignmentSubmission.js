import mongoose from 'mongoose';

/**
 * Assignment Submission Schema definition for the database.
 * Created when a student submits work for a specific assignment.
 */
const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    originalName: {
      type: String,
      default: '',
    },
    storedName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    submissionText: {
      type: String,
      default: '',
      maxlength: [2000, 'Submission text cannot exceed 2000 characters'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    marks: {
      type: Number,
      default: null,
      min: [0, 'Marks cannot be negative'],
    },
    feedback: {
      type: String,
      default: '',
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one submission record per student per assignment (can be updated before deadline)
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1, student: 1 });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

export default AssignmentSubmission;
