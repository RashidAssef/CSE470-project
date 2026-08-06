import mongoose from 'mongoose';

/**
 * Notification Schema definition for the database.
 *
 * Generic, event-agnostic notification record. Any feature can create one via
 * the notificationService helper (see services/notificationService.js) — this
 * model deliberately does not care whether the event was an enrollment, a
 * graded submission, a quiz result, or an announcement. The `type` and
 * `link` fields let the frontend route/style each notification appropriately
 * without the schema needing to change every time a new event type is added.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment',
        'unenrollment',
        'assignment',
        'quiz',
        'grade',
        'announcement',
        'general',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    // Optional frontend route this notification should link to when clicked,
    // e.g. `/courses/<id>` or `/student/dashboard`.
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Notifications are almost always queried "give me this user's latest first"
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
