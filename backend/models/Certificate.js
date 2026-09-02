import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    quizzesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    instructorName: {
      type: String,
      default: '',
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
