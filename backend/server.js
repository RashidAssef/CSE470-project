import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Express Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Vite default development port
  credentials: true
}));
app.use(express.json()); // Allow parsing of JSON bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/quizzes', quizRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development mode to avoid exposing sensitive details
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Wildcard Page Not Found Route
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found on this server`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
