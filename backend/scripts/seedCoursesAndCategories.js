import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';

// Load environment variables
dotenv.config();

const sampleCategories = [
  { name: 'Web Development', description: 'Frontend, backend, and full-stack web courses.' },
  { name: 'Data Science', description: 'Machine learning, statistics, and data analysis.' },
  { name: 'Design', description: 'UI/UX and visual design fundamentals.' },
  { name: 'Mobile Development', description: 'Android, iOS, and cross-platform app development.' },
  { name: 'Cybersecurity', description: 'Ethical hacking, network security, and defense.' },
  { name: 'Marketing', description: 'Digital marketing, SEO, and social media strategy.' }
];

const sampleCourses = [
  {
    title: 'Full-Stack Web Development with MERN',
    description: 'Build complete web applications using MongoDB, Express, React, and Node.js, from database design to deployment.',
    categoryName: 'Web Development',
    level: 'intermediate',
    price: 49.99,
    status: 'published',
  },
  {
    title: 'Machine Learning for Beginners',
    description: 'A hands-on introduction to machine learning concepts, covering supervised learning, model evaluation, and practical projects.',
    categoryName: 'Data Science',
    level: 'beginner',
    price: 0,
    status: 'published',
  },
  {
    title: 'UI/UX Design Foundations',
    description: 'Learn the core principles of user interface and user experience design, from wireframes to interactive prototypes.',
    categoryName: 'Design',
    level: 'beginner',
    price: 29.99,
    status: 'published',
  },
  {
    title: 'Advanced React and Redux',
    description: 'Master React 18, React Router, Redux Toolkit, and advanced state management patterns.',
    categoryName: 'Web Development',
    level: 'advanced',
    price: 19.99,
    status: 'published',
  },
  {
    title: 'Python for Data Analysis',
    description: 'Learn Python, Pandas, NumPy, and Matplotlib to analyze and visualize real-world datasets.',
    categoryName: 'Data Science',
    level: 'beginner',
    price: 0,
    status: 'published',
  },
  {
    title: 'iOS App Development with Swift',
    description: 'Build native iOS applications using Swift and SwiftUI from scratch.',
    categoryName: 'Mobile Development',
    level: 'intermediate',
    price: 59.99,
    status: 'published',
  },
  {
    title: 'Introduction to Ethical Hacking',
    description: 'Understand common security vulnerabilities, penetration testing tools, and defensive measures.',
    categoryName: 'Cybersecurity',
    level: 'beginner',
    price: 0,
    status: 'published',
  },
  {
    title: 'Search Engine Optimization (SEO) Masterclass',
    description: 'Learn how to rank websites on search engines, conduct keyword research, and optimize on-page content.',
    categoryName: 'Marketing',
    level: 'intermediate',
    price: 9.99,
    status: 'published',
  },
  {
    title: 'Docker and Kubernetes in Practice',
    description: 'Learn how to containerize applications and manage clusters with Kubernetes in production.',
    categoryName: 'Web Development',
    level: 'advanced',
    price: 39.99,
    status: 'published',
  }
];

const seedCoursesAndCategories = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Fetch active instructors to associate categories/courses with
    const activeInstructors = await User.find({ role: 'instructor', status: 'active' });
    if (activeInstructors.length === 0) {
      console.log('[Seed] No active instructors found. Please run seedUsers.js first.');
      process.exit(1);
    }

    console.log(`[Seed] Found ${activeInstructors.length} active instructors.`);

    // 2. Ensure sample categories exist
    const categoryMap = {};
    for (const cat of sampleCategories) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        // Assign a random active instructor as the creator of the category
        const creator = activeInstructors[Math.floor(Math.random() * activeInstructors.length)];
        category = await Category.create({ ...cat, createdBy: creator._id });
        console.log(`[Seed] Created category: ${category.name} (Created by: ${creator.name})`);
      } else {
        console.log(`[Seed] Category already exists: ${category.name}`);
      }
      categoryMap[cat.name] = category._id;
    }

    // 3. Ensure sample courses exist
    for (const courseData of sampleCourses) {
      const exists = await Course.findOne({ title: courseData.title });
      if (exists) {
        console.log(`[Seed] Course already exists: ${courseData.title}`);
        continue;
      }

      // Assign a random active instructor to teach the course
      const instructor = activeInstructors[Math.floor(Math.random() * activeInstructors.length)];
      const { categoryName, ...rest } = courseData;

      const course = await Course.create({
        ...rest,
        category: categoryMap[categoryName],
        instructor: instructor._id,
      });
      console.log(`[Seed] Created course: ${course.title} (Instructor: ${instructor.name})`);
    }

    console.log('==================================================');
    console.log('[Seed] Categories and courses bootstrapped successfully!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed categories and courses: ${error.message}`);
    process.exit(1);
  }
};

seedCoursesAndCategories();
