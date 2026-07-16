import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

// Load environment variables
dotenv.config();

const seedEnrollments = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Fetch all students
    const students = await User.find({ role: 'student', status: 'active' });
    if (students.length === 0) {
      console.log('[Seed] No active students found. Run seedUsers.js first.');
      process.exit(1);
    }

    // 2. Fetch all published courses
    const courses = await Course.find({ status: 'published' });
    if (courses.length === 0) {
      console.log('[Seed] No published courses found. Run seedCoursesAndCategories.js first.');
      process.exit(1);
    }

    console.log(`[Seed] Found ${students.length} students and ${courses.length} published courses.`);

    let enrolledCount = 0;
    let skippedCount = 0;

    // 3. Auto-enroll each student in a random subset of courses
    for (const student of students) {
      // Determine a random number of courses to enroll in (e.g., 1 to 4 courses)
      const numCourses = Math.floor(Math.random() * 4) + 1;
      
      // Shuffle courses list to pick randomly
      const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numCourses);

      for (const course of selectedCourses) {
        // Check duplicate
        const exists = await Enrollment.findOne({ student: student._id, course: course._id });
        if (exists) {
          skippedCount++;
          continue;
        }

        // Create enrollment
        await Enrollment.create({
          student: student._id,
          course: course._id,
          status: 'active',
          progress: Math.floor(Math.random() * 101) // Random progress between 0 and 100
        });

        // Increment Course enrolledCount
        course.enrolledCount += 1;
        await course.save();
        
        enrolledCount++;
      }
    }

    console.log('==================================================');
    console.log('[Seed] Auto-enrollment seeding completed.');
    console.log(`Successfully enrolled students: ${enrolledCount} times`);
    console.log(`Skipped duplicate/existing enrollments: ${skippedCount}`);
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed enrollments: ${error.message}`);
    process.exit(1);
  }
};

seedEnrollments();
