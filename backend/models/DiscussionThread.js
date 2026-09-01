import mongoose from 'mongoose';

/**
 * DiscussionThread Schema definition for the database.
 * A thread is a single question/topic started inside a course's discussion
 * forum. Its replies live in the separate Post model (see Post.js) rather
 * than as a subdocument array, since a thread's reply count is unbounded
 * and we want each reply independently queryable/deletable.
 */
const discussionThreadSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    // Denormalized counters, kept in sync by the forum controller — avoids a
    // separate count query every time the thread list is rendered.
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

discussionThreadSchema.index({ course: 1, isPinned: -1, lastActivityAt: -1 });

const DiscussionThread = mongoose.model('DiscussionThread', discussionThreadSchema);

export default DiscussionThread;
