import Notification from '../models/Notification.js';

/**
 * ==========================================================================
 * SHARED HELPER FOR THE WHOLE TEAM
 * ==========================================================================
 * Call this from ANY controller when something happens that a user should be
 * notified about (a graded submission, a new quiz, an announcement, etc).
 * This keeps notification-creation logic in one place instead of every
 * feature reinventing its own version.
 *
 * Usage example (e.g. inside a future Assignment grading controller):
 *
 *   import { createNotification } from '../services/notificationService.js';
 *
 *   await createNotification({
 *     user: submission.student,
 *     type: 'grade',
 *     title: 'Assignment graded',
 *     message: `Your submission for "${assignment.title}" was graded: ${grade}/100`,
 *     link: `/courses/${assignment.course}`,
 *   });
 *
 * `type` must be one of the enum values in models/Notification.js. If your
 * feature needs a new type (e.g. 'assignment_deadline'), add it to that enum
 * — don't reuse 'general' for everything, it defeats the point of filtering.
 *
 * Failures here are intentionally swallowed (logged, not thrown) so that a
 * notification failing to save never breaks the actual feature calling it —
 * e.g. a submission should still get graded even if the notification insert
 * fails for some reason.
 * ==========================================================================
 */
export const createNotification = async ({ user, type = 'general', title, message, link = '' }) => {
  try {
    if (!user || !title || !message) {
      console.error('[NotificationService] Missing required fields, skipping notification.');
      return null;
    }

    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      link,
    });

    return notification;
  } catch (error) {
    console.error(`[NotificationService] Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Convenience helper for notifying every student enrolled in a course at
 * once (e.g. a new announcement or a new quiz being published). Takes an
 * array of user IDs rather than querying Enrollment itself, so this stays
 * decoupled from the Enrollment model.
 */
export const notifyManyUsers = async (userIds, { type = 'general', title, message, link = '' }) => {
  try {
    const docs = userIds.map((user) => ({ user, type, title, message, link }));
    return await Notification.insertMany(docs);
  } catch (error) {
    console.error(`[NotificationService] Failed to bulk-create notifications: ${error.message}`);
    return null;
  }
};
