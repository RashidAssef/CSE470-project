import mongoose from 'mongoose';

/**
 * Post Schema definition for the database.
 * A single message inside a DiscussionThread. The first post of a thread
 * (the opening question) and every reply after it are both stored here —
 * the controller treats index-0-by-creation-time as the "opening post" when
 * rendering, rather than duplicating that content on the Thread document.
 */
const postSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionThread',
      required: true,
    },
    // Denormalized so we can query "all posts in this course" without a join
    // through DiscussionThread — useful for future moderation tooling.
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [3000, 'Post cannot exceed 3000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ thread: 1, createdAt: 1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
