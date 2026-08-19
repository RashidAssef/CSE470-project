import mongoose from 'mongoose';

/**
 * Assignment Schema definition for the database.
 * Created by instructors for specific courses.
 */
const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline date and time is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
      default: 100,
    },
    attachment: {
      originalName: { type: String, default: '' },
      storedName: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size: { type: Number, default: 0 },
      fileUrl: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ course: 1, deadline: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
