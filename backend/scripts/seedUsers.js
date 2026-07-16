import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    const usersToSeed = [];

    // Generate 50 students
    for (let i = 1; i <= 50; i++) {
      usersToSeed.push({
        name: `Student ${i}`,
        email: `student${i}@pathway.com`,
        password: 'studentPass123',
        role: 'student',
        status: 'active'
      });
    }

    // Generate 10 instructors (5 active/verified, 5 pending)
    for (let i = 1; i <= 10; i++) {
      const isVerified = i <= 5;
      usersToSeed.push({
        name: `Instructor ${i} (${isVerified ? 'Verified' : 'Pending'})`,
        email: `instructor${i}@pathway.com`,
        password: 'instructorPass123',
        role: 'instructor',
        status: isVerified ? 'active' : 'pending'
      });
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of usersToSeed) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        skippedCount++;
        continue;
      }
      await User.create(userData);
      createdCount++;
    }

    console.log('==================================================');
    console.log('[Seed] Seeding completed.');
    console.log(`Created: ${createdCount} users`);
    console.log(`Skipped: ${skippedCount} existing users`);
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed users: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
