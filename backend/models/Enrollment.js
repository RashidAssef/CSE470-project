import mongoose from 'mongoose';

/**
 * Enrollment Schema definition for the database.
 * Links a student to a course they've enrolled in. A student can only
 * enroll in a given course once (enforced by the compound unique index below).
 */
const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    // Placeholder for the future Progress Tracking feature (separate sprint item).
    // Left here so that feature can be built without touching this schema again.
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, // createdAt effectively doubles as "enrolledAt"
  }
);

// Prevent the same student from enrolling in the same course twice.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
