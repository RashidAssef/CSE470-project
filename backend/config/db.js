import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using Mongoose.
 * Logs connection status and handles connection errors.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    // Exit process with failure code
    process.exit(1);
  }
};

export default connectDB;
