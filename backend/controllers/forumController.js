import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import DiscussionThread from '../models/DiscussionThread.js';
import Post from '../models/Post.js';
import { canManageCourse } from '../utils/courseAccess.js';
import { notifyManyUsers } from '../services/notificationService.js';

/**
 * True if the user may view/post in this course's forum: enrolled students,
 * or anyone who can manage the course (instructor/co-instructor/admin).
 * Forum access is intentionally NOT public, unlike course materials —
 * discussions are for course participants only.
 */
const canAccessForum = async (course, user) => {
  if (!user) return false;
  if (canManageCourse(course, user)) return true;
  if (user.role !== 'student') return false;

  const enrolled = await Enrollment.findOne({ course: course._id, student: user._id });
  return !!enrolled;
};

const threadPayload = (thread) => ({
  _id: thread._id,
  title: thread.title,
  createdBy: thread.createdBy,
  isPinned: thread.isPinned,
  postCount: thread.postCount,
  lastActivityAt: thread.lastActivityAt,
  createdAt: thread.createdAt,
});

const postPayload = (post) => ({
  _id: post._id,
  thread: post.thread,
  author: post.author,
  content: post.content,
  createdAt: post.createdAt,
});

/**
 * @desc    Create a new discussion thread (with its opening post)
 * @route   POST /api/courses/:courseId/threads
 * @access  Private — enrolled students, instructor, co-instructors, admin
 */
export const createThread = async (req, res, next) => {
  const { courseId } = req.params;
  const title = (req.body.title || '').trim();
  const content = (req.body.content || '').trim();

  try {
    if (!title || !content) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a thread title and an opening message',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!(await canAccessForum(course, req.user))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to use its discussion forum',
      });
    }

    const thread = await DiscussionThread.create({
      course: courseId,
      title,
      createdBy: req.user._id,
      postCount: 1,
      lastActivityAt: new Date(),
    });

    const openingPost = await Post.create({
      thread: thread._id,
      course: courseId,
      author: req.user._id,
      content,
    });

    // Notify the instructor(s) that a new thread was started — skip if the
    // instructor is the one who started it.
    const notifyTargets = [course.instructor, ...(course.coInstructors || [])].filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    if (notifyTargets.length > 0) {
      await notifyManyUsers(notifyTargets, {
        type: 'forum',
        title: 'New discussion thread',
        message: `${req.user.name} started a new thread "${title}" in "${course.title}".`,
        link: `/courses/${courseId}/forum/${thread._id}`,
      });
    }

    const populatedThread = await thread.populate('createdBy', 'name role');
    const populatedPost = await openingPost.populate('author', 'name role');

    res.status(201).json({
      status: 'success',
      message: 'Thread created',
      data: {
        thread: threadPayload(populatedThread),
        openingPost: postPayload(populatedPost),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List threads for a course (pinned first, most recently active first)
 * @route   GET /api/courses/:courseId/threads
 * @access  Private — enrolled students, instructor, co-instructors, admin
 */
export const getThreads = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!(await canAccessForum(course, req.user))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to view its discussion forum',
      });
    }

    const threads = await DiscussionThread.find({ course: courseId })
      .populate('createdBy', 'name role')
      .sort({ isPinned: -1, lastActivityAt: -1 });

    res.status(200).json({
      status: 'success',
      results: threads.length,
      data: threads.map(threadPayload),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single thread with all of its posts, in chronological order
 * @route   GET /api/courses/:courseId/threads/:threadId
 * @access  Private — enrolled students, instructor, co-instructors, admin
 */
export const getThreadById = async (req, res, next) => {
  const { courseId, threadId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!(await canAccessForum(course, req.user))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to view its discussion forum',
      });
    }

    const thread = await DiscussionThread.findOne({ _id: threadId, course: courseId }).populate(
      'createdBy',
      'name role'
    );
    if (!thread) {
      return res.status(404).json({ status: 'fail', message: 'Thread not found' });
    }

    const posts = await Post.find({ thread: threadId })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        thread: threadPayload(thread),
        posts: posts.map(postPayload),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to a thread
 * @route   POST /api/courses/:courseId/threads/:threadId/posts
 * @access  Private — enrolled students, instructor, co-instructors, admin
 */
export const createPost = async (req, res, next) => {
  const { courseId, threadId } = req.params;
  const content = (req.body.content || '').trim();

  try {
    if (!content) {
      return res.status(400).json({ status: 'fail', message: 'Reply cannot be empty' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    if (!(await canAccessForum(course, req.user))) {
      return res.status(403).json({
        status: 'fail',
        message: 'You must be enrolled in this course to use its discussion forum',
      });
    }

    const thread = await DiscussionThread.findOne({ _id: threadId, course: courseId });
    if (!thread) {
      return res.status(404).json({ status: 'fail', message: 'Thread not found' });
    }

    const post = await Post.create({
      thread: threadId,
      course: courseId,
      author: req.user._id,
      content,
    });

    thread.postCount += 1;
    thread.lastActivityAt = new Date();
    await thread.save();

    // Notify the thread starter + instructor(s), skipping whoever just replied
    const notifyTargets = [thread.createdBy, course.instructor, ...(course.coInstructors || [])]
      .map((id) => id.toString())
      .filter((id, i, arr) => arr.indexOf(id) === i) // de-dupe
      .filter((id) => id !== req.user._id.toString());

    if (notifyTargets.length > 0) {
      await notifyManyUsers(notifyTargets, {
        type: 'forum',
        title: 'New reply in a thread you follow',
        message: `${req.user.name} replied to "${thread.title}" in "${course.title}".`,
        link: `/courses/${courseId}/forum/${threadId}`,
      });
    }

    const populatedPost = await post.populate('author', 'name role');

    res.status(201).json({
      status: 'success',
      message: 'Reply posted',
      data: postPayload(populatedPost),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a thread (and all of its posts)
 * @route   DELETE /api/courses/:courseId/threads/:threadId
 * @access  Private — thread author, or instructor/co-instructor/admin of the course
 */
export const deleteThread = async (req, res, next) => {
  const { courseId, threadId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    const thread = await DiscussionThread.findOne({ _id: threadId, course: courseId });
    if (!thread) {
      return res.status(404).json({ status: 'fail', message: 'Thread not found' });
    }

    const isAuthor = thread.createdBy.toString() === req.user._id.toString();
    if (!isAuthor && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this thread',
      });
    }

    await Post.deleteMany({ thread: threadId });
    await DiscussionThread.findByIdAndDelete(threadId);

    res.status(200).json({ status: 'success', message: 'Thread deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a single post/reply
 * @route   DELETE /api/courses/:courseId/threads/:threadId/posts/:postId
 * @access  Private — post author, or instructor/co-instructor/admin of the course
 */
export const deletePost = async (req, res, next) => {
  const { courseId, threadId, postId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: 'fail', message: 'Course not found' });
    }

    const post = await Post.findOne({ _id: postId, thread: threadId });
    if (!post) {
      return res.status(404).json({ status: 'fail', message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    if (!isAuthor && !canManageCourse(course, req.user)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(postId);

    await DiscussionThread.findByIdAndUpdate(threadId, {
      $inc: { postCount: -1 },
    });

    res.status(200).json({ status: 'success', message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};
