import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';

// Load environment variables from the parent backend folder
dotenv.config();

/**
 * Seeds sample categories, a demo instructor, and a handful of published
 * courses so the Course Enrollment feature can be built and demoed before
 * the real Course Creation feature (a separate sprint item) exists.
 *
 * Safe to re-run: skips creation of anything that already exists by name/email.
 *
 * Run command: node scripts/seedCourses.js
 */
const sampleCategories = [
  { name: 'Web Development', description: 'Frontend, backend, and full-stack web courses.' },
  { name: 'Data Science', description: 'Machine learning, statistics, and data analysis.' },
  { name: 'Design', description: 'UI/UX and visual design fundamentals.' },
];

const sampleCourses = [
  {
    title: 'Full-Stack Web Development with MERN',
    description:
      'Build complete web applications using MongoDB, Express, React, and Node.js, from database design to deployment.',
    categoryName: 'Web Development',
    level: 'intermediate',
    price: 0,
    status: 'published',
  },
  {
    title: 'Machine Learning for Beginners',
    description:
      'A hands-on introduction to machine learning concepts, covering supervised learning, model evaluation, and practical projects.',
    categoryName: 'Data Science',
    level: 'beginner',
    price: 0,
    status: 'published',
  },
  {
    title: 'UI/UX Design Foundations',
    description:
      'Learn the core principles of user interface and user experience design, from wireframes to interactive prototypes.',
    categoryName: 'Design',
    level: 'beginner',
    price: 0,
    status: 'published',
  },
];

const seedCourses = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Ensure a demo instructor exists (courses require an instructor ref)
    const instructorEmail = 'instructor@pathway.com';
    let instructor = await User.findOne({ email: instructorEmail });
    if (!instructor) {
      instructor = await User.create({
        name: 'Demo Instructor',
        email: instructorEmail,
        password: 'instructorPass123',
        role: 'instructor',
        status: 'active', // pre-approved so seeded courses work immediately
      });
      console.log(`[Seed] Created demo instructor: ${instructor.email}`);
    }

    // 2. Ensure sample categories exist
    const categoryMap = {};
    for (const cat of sampleCategories) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        category = await Category.create({ ...cat, createdBy: instructor._id });
        console.log(`[Seed] Created category: ${category.name}`);
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

      const { categoryName, ...rest } = courseData;
      const course = await Course.create({
        ...rest,
        category: categoryMap[categoryName],
        instructor: instructor._id,
      });
      console.log(`[Seed] Created course: ${course.title}`);
    }

    console.log('==================================================');
    console.log('[Seed] Sample courses bootstrapped successfully!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed database: ${error.message}`);
    process.exit(1);
  }
};

seedCourses();
