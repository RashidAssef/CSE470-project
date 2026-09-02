/**
 * Sprint Data Seeder
 * Seeds demo data for Radial's 4 sprints:
 *   Sprint 1 - Video Lectures
 *   Sprint 2 - Announcements
 *   Sprint 3 - Grading & Progress (Assignments + Submissions with grades)
 *   Sprint 4 - Wishlist
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Course from './models/Course.js';
import User from './models/User.js';
import Category from './models/Category.js';
import VideoLecture from './models/VideoLecture.js';
import Announcement from './models/Announcement.js';
import Assignment from './models/Assignment.js';
import AssignmentSubmission from './models/AssignmentSubmission.js';
import Enrollment from './models/Enrollment.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cse470_db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Find Instructor (Radial)
  const instructor = await User.findOne({ email: 'radial.rahman@g.bracu.ac.bd' });
  if (!instructor) {
    console.error('Instructor not found. Make sure radial.rahman@g.bracu.ac.bd exists.');
    process.exit(1);
  }
  console.log('Instructor found: ' + instructor.name);

  // Find or create Category
  let category = await Category.findOne({});
  if (!category) {
    category = await Category.create({ name: 'Technology', description: 'Tech & CS courses', createdBy: instructor._id });
  }
  console.log('Category: ' + category.name);

  // Find AI Course
  let aiCourse = await Course.findOne({ title: /Artificial Intelligence/i });
  if (!aiCourse) {
    aiCourse = await Course.create({
      title: 'Introduction to Artificial Intelligence',
      description: 'Learn AI, Machine Learning, and Neural Networks from scratch.',
      instructor: instructor._id,
      category: category._id,
      price: 0,
      level: 'beginner',
      status: 'published',
      modules: [
        { title: 'Module 1: What is AI?', description: 'History and overview of Artificial Intelligence.', order: 1 },
        { title: 'Module 2: Machine Learning Basics', description: 'Supervised, unsupervised, and reinforcement learning.', order: 2 },
        { title: 'Module 3: Neural Networks', description: 'Deep learning and neural network architectures.', order: 3 },
      ],
    });
    console.log('AI Course created with 3 modules');
  } else {
    if (!aiCourse.modules || aiCourse.modules.length === 0) {
      aiCourse.modules = [
        { title: 'Module 1: What is AI?', description: 'History and overview.', order: 1 },
        { title: 'Module 2: Machine Learning Basics', description: 'Supervised and unsupervised learning.', order: 2 },
        { title: 'Module 3: Neural Networks', description: 'Deep learning architectures.', order: 3 },
      ];
      await aiCourse.save();
      console.log('Added 3 modules to existing AI course');
    } else {
      console.log('AI Course found: ' + aiCourse.title + ' (' + aiCourse.modules.length + ' modules)');
    }
  }

  // Create extra courses for Wishlist Sprint
  const extraCourses = [
    { title: 'Web Development with React', description: 'Build modern web apps using React, hooks, and REST APIs.', level: 'intermediate', price: 0 },
    { title: 'Python for Data Science', description: 'Use Python, Pandas, and Matplotlib for real data analysis.', level: 'beginner', price: 0 },
    { title: 'Database Systems and SQL', description: 'Master relational databases, SQL queries, and normalization.', level: 'beginner', price: 0 },
  ];

  const createdCourses = [];
  for (const c of extraCourses) {
    let existing = await Course.findOne({ title: c.title });
    if (!existing) {
      existing = await Course.create({ ...c, instructor: instructor._id, category: category._id, status: 'published' });
      console.log('Created course: ' + c.title);
    } else {
      console.log('Course already exists: ' + c.title);
    }
    createdCourses.push(existing);
  }

  // Sprint 4: Wishlist - add all courses to instructor wishlist
  const allCourseIds = [aiCourse._id, ...createdCourses.map(c => c._id)];
  const currentWishlist = instructor.wishlist.map(id => id.toString());
  let wishlistUpdated = false;
  for (const courseId of allCourseIds) {
    if (!currentWishlist.includes(courseId.toString())) {
      instructor.wishlist.push(courseId);
      wishlistUpdated = true;
    }
  }
  if (wishlistUpdated) {
    await instructor.save();
    console.log('Sprint 4 (Wishlist): Added ' + allCourseIds.length + ' courses to wishlist');
  } else {
    console.log('Sprint 4 (Wishlist): Wishlist already populated');
  }

  // Sprint 1: Video Lectures
  const existingLectures = await VideoLecture.countDocuments({ course: aiCourse._id });
  if (existingLectures === 0) {
    const lectures = [
      { course: aiCourse._id, moduleOrder: 1, title: 'What is Artificial Intelligence?', videoUrl: 'https://www.youtube.com/watch?v=2ePf9rue1Ao', duration: 600, order: 1, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 1, title: 'History of AI: From Turing to ChatGPT', videoUrl: 'https://www.youtube.com/watch?v=JMUxmLyrhSk', duration: 780, order: 2, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 1, title: 'Types of AI: Narrow vs General vs Super', videoUrl: 'https://www.youtube.com/watch?v=kpuBj7CagQ4', duration: 540, order: 3, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 2, title: 'Introduction to Machine Learning', videoUrl: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI', duration: 900, order: 1, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 2, title: 'Supervised vs Unsupervised Learning', videoUrl: 'https://www.youtube.com/watch?v=1AVrWOVwpBc', duration: 720, order: 2, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 2, title: 'Training a Simple Linear Regression', videoUrl: 'https://www.youtube.com/watch?v=nk2CQITm_eo', duration: 660, order: 3, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 3, title: 'What is a Neural Network?', videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', duration: 1020, order: 1, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 3, title: 'Backpropagation Explained Visually', videoUrl: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U', duration: 1140, order: 2, uploadedBy: instructor._id },
      { course: aiCourse._id, moduleOrder: 3, title: 'Intro to Convolutional Neural Networks', videoUrl: 'https://www.youtube.com/watch?v=YRhxdVk_sIs', duration: 840, order: 3, uploadedBy: instructor._id },
    ];
    await VideoLecture.insertMany(lectures);
    console.log('Sprint 1 (Video Lectures): Added ' + lectures.length + ' videos across 3 modules');
  } else {
    console.log('Sprint 1 (Video Lectures): ' + existingLectures + ' lectures already exist');
  }

  // Sprint 2: Announcements
  const existingAnn = await Announcement.countDocuments({ course: aiCourse._id });
  if (existingAnn === 0) {
    await Announcement.insertMany([
      {
        course: aiCourse._id,
        instructor: instructor._id,
        title: 'Welcome to Introduction to AI!',
        content: 'Welcome everyone! I am excited to have you in this course. We will explore the fascinating world of Artificial Intelligence together. Please start by watching Module 1 videos and feel free to ask questions at any time.',
      },
      {
        course: aiCourse._id,
        instructor: instructor._id,
        title: 'Assignment 1 Due Date Reminder',
        content: 'Reminder that Assignment 1 (AI Concepts Summary) is due in one week. Make sure you have completed all Module 1 videos before submitting. If you have any issues, please reach out.',
      },
      {
        course: aiCourse._id,
        instructor: instructor._id,
        title: 'New Study Resources Added',
        content: 'I have uploaded additional reading materials in the Course Materials section. These include cheat sheets for ML algorithms and a glossary of AI terms. Highly recommended before Module 2.',
      },
      {
        course: aiCourse._id,
        instructor: instructor._id,
        title: 'Module 3 (Neural Networks) is now LIVE!',
        content: 'Module 3 videos are now available! We dive into the mathematics behind neural networks. This is the most exciting part of the course. Take your time and rewatch as needed. The final quiz will cover Module 3 content.',
      },
    ]);
    console.log('Sprint 2 (Announcements): Added 4 announcements');
  } else {
    console.log('Sprint 2 (Announcements): ' + existingAnn + ' announcements already exist');
  }

  // Sprint 3: Grading & Progress - Create demo student
  let student = await User.findOne({ role: 'student', status: 'active' });
  if (!student) {
    student = await User.create({
      name: 'Demo Student',
      email: 'demo.student@bracu.ac.bd',
      password: 'student123',
      role: 'student',
      status: 'active',
    });
    console.log('Sprint 3: Created demo student (demo.student@bracu.ac.bd / student123)');
  } else {
    console.log('Sprint 3: Using existing student: ' + student.name);
  }

  // Enroll student in AI course with progress
  let enrollment = await Enrollment.findOne({ student: student._id, course: aiCourse._id });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      student: student._id,
      course: aiCourse._id,
      status: 'active',
      progress: 65,
    });
    await Course.findByIdAndUpdate(aiCourse._id, { $inc: { enrolledCount: 1 } });
    console.log('Sprint 3: Enrolled demo student in AI course with 65% progress');
  } else {
    if (enrollment.progress === 0) {
      enrollment.progress = 65;
      await enrollment.save();
    }
    console.log('Sprint 3: Student already enrolled (progress: ' + enrollment.progress + '%)');
  }

  // Create assignments
  const existingAssignments = await Assignment.countDocuments({ course: aiCourse._id });
  let assignments = [];
  if (existingAssignments === 0) {
    assignments = await Assignment.insertMany([
      {
        course: aiCourse._id,
        createdBy: instructor._id,
        title: 'Assignment 1: AI Concepts Summary',
        description: 'Write a 500-word summary explaining what Artificial Intelligence is, its history, and three real-world applications. Include references.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        status: 'published',
      },
      {
        course: aiCourse._id,
        createdBy: instructor._id,
        title: 'Assignment 2: ML Algorithm Comparison',
        description: 'Compare and contrast Supervised vs Unsupervised Learning. Provide 2 example algorithms for each, with use cases. Minimum 400 words.',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        status: 'published',
      },
      {
        course: aiCourse._id,
        createdBy: instructor._id,
        title: 'Assignment 3: Neural Network Architecture Design',
        description: 'Design a simple neural network for classifying handwritten digits. Draw the architecture, specify the layers, and explain your design choices.',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        status: 'published',
      },
    ]);
    console.log('Sprint 3 (Grading): Created ' + assignments.length + ' assignments');
  } else {
    assignments = await Assignment.find({ course: aiCourse._id });
    console.log('Sprint 3 (Grading): ' + existingAssignments + ' assignments already exist');
  }

  // Create a graded submission for Assignment 1
  if (assignments.length > 0) {
    const existingSub = await AssignmentSubmission.findOne({
      assignment: assignments[0]._id,
      student: student._id,
    });
    if (!existingSub) {
      await AssignmentSubmission.create({
        assignment: assignments[0]._id,
        course: aiCourse._id,
        student: student._id,
        submissionText: 'Artificial Intelligence (AI) is the simulation of human intelligence in machines programmed to think and learn like humans. The term was coined by John McCarthy in 1956. AI has evolved from simple rule-based systems to advanced deep learning models like GPT. Real-world applications include: (1) Healthcare AI diagnoses diseases from X-rays. (2) Transportation Self-driving cars use AI for navigation. (3) Finance Fraud detection algorithms analyze transactions in real time.',
        originalName: 'assignment1_submission.pdf',
        storedName: 'assignment1_submission.pdf',
        fileUrl: '',
        marks: 87,
        feedback: 'Excellent work! Clear explanation of AI history and solid real-world examples. The finance use case was particularly well-chosen. Next time, try to include more technical depth on the learning algorithms. Overall, great job!',
        status: 'graded',
      });
      console.log('Sprint 3 (Grading): Created graded submission (87/100) for Assignment 1');
    } else {
      console.log('Sprint 3 (Grading): Submission for Assignment 1 already exists');
    }
  }

  console.log('\nAll 4 Sprint data seeded successfully!');
  console.log('Sprint 1 (Video Lectures) - 9 videos in 3 modules');
  console.log('Sprint 2 (Announcements)  - 4 announcements');
  console.log('Sprint 3 (Grading)        - 3 assignments + 1 graded submission (87/100)');
  console.log('Sprint 4 (Wishlist)       - 4 courses in wishlist');
  console.log('\nDemo student login: demo.student@bracu.ac.bd / student123\n');

  process.exit(0);
}

seed().catch(e => {
  console.error('Seed error:', e.message);
  process.exit(1);
});
