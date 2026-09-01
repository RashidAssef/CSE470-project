import mongoose from 'mongoose';

/**
 * Review Schema definition for the database.
 * One review per (student, course) pair — a student can edit their existing
 * review instead of leaving a second one, enforced by the unique index below.
 * Course.averageRating / Course.reviewCount are denormalized and kept in
 * sync by the review controller, same pattern as Course.enrolledCount.
 */
const reviewSchema = new mongoose.Schema(
  {
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
    rating: {
      type: Number,
      required: [true, 'A rating from 1 to 5 is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
