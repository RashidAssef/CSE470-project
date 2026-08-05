import mongoose from 'mongoose';

const courseMaterialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    moduleOrder: {
      type: Number,
      default: null,
    },
    originalName: {
      type: String,
      required: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

courseMaterialSchema.index({ course: 1, createdAt: -1 });

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);

export default CourseMaterial;
