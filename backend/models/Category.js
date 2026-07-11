import mongoose from 'mongoose';

/**
 * Category Schema definition for the database.
 * Used by instructors to classify courses and by students to search/filter them.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware hook.
 * Automatically generates a url-friendly URL slug from the category name.
 * e.g., "Web Development & Coding" -> "web-development-coding"
 */
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')    // Remove special characters
      .replace(/[\s_-]+/g, '-')     // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
