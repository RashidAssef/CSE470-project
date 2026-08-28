import mongoose from 'mongoose';

/**
 * Course Schema definition for the database.
 *
 * NOTE FOR THE TEAM: This is a deliberately minimal schema, created to unblock
 * the Course Enrollment feature (Sprint 1). Course Creation (Rashed) is expected
 * to extend this model with richer fields (learning materials, modules, syllabus,
 * pricing tiers, etc.) in a later sprint. Please extend rather than replace this
 * file, and keep field names backward compatible so Enrollment doesn't break.
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Course category is required'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must have an instructor'],
    },
    coInstructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    // Denormalized counter kept in sync by the Enrollment controller.
    // Avoids a full aggregation query every time a course card is rendered.
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Denormalized rating stats, kept in sync by the Review controller —
    // same reasoning as enrolledCount above.
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Ordered learning path modules for this course (Module 1 → Module 2 → …)
    modules: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 120,
        },
        description: {
          type: String,
          default: '',
          maxlength: 1000,
        },
        order: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);

export default Course;
