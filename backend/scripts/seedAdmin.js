import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Seeds a default Admin user into the database if none exists.
 * This is crucial for initial login and system bootstrapping.
 * 
 * Run command: node scripts/seedAdmin.js
 * Make sure MONGODB_URI is correctly defined in backend/.env
 */
const seedAdmin = async () => {
  try {
    // 1. Establish database connection
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    const adminEmail = 'admin@pathway.com';

    // 2. Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(`[Seed] Admin user already exists with email: ${adminEmail}`);
      process.exit(0);
    }

    // 3. Create Admin User
    // Note: The User model's pre-save middleware will handle password hashing
    // and automatically set status to 'active' for admin role.
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'adminPassword123', // Clean, simple default password for testing
      role: 'admin',
    });

    console.log('==================================================');
    console.log('[Seed] Default Admin User Bootstrapped Successfully!');
    console.log(`Email:    ${adminUser.email}`);
    console.log('Password: adminPassword123');
    console.log(`Role:     ${adminUser.role}`);
    console.log(`Status:   ${adminUser.status}`);
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed database: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
