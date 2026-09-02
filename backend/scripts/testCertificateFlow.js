import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import { evaluateCourseQuizMastery } from '../controllers/certificateController.js';
import { generateCertificatePDFStream } from '../utils/certificateGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testFlow = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected.');

    // 1. Find student
    const student = await User.findOne({ role: 'student' });
    if (!student) throw new Error('No student found in DB');
    console.log(`Testing with student: ${student.name} (${student.email})`);

    // 2. Find a course with published quizzes
    const quizzes = await Quiz.find({ isPublished: true });
    if (quizzes.length === 0) throw new Error('No published quizzes found');
    
    // Group by course to find a course with quizzes
    const courseId = quizzes[0].course;
    const course = await Course.findById(courseId).populate('instructor', 'name');
    console.log(`Testing with course: "${course.title}"`);

    const courseQuizzes = await Quiz.find({ course: courseId, isPublished: true });
    console.log(`Course has ${courseQuizzes.length} published quiz(zes).`);

    // Ensure student is enrolled
    let enrollment = await Enrollment.findOne({ course: courseId, student: student._id });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        course: courseId,
        student: student._id,
        status: 'active',
        progress: 0,
      });
      console.log('Created enrollment for student.');
    }

    // Clean previous attempts and certificates for clean test run
    await QuizAttempt.deleteMany({ course: courseId, student: student._id });
    await Certificate.deleteMany({ course: courseId, student: student._id });

    // 3. Verify that before passing all quizzes, student is NOT eligible
    let mastery = await evaluateCourseQuizMastery(courseId, student._id);
    console.log(`Initial mastery eligible: ${mastery.eligible} (Passed: ${mastery.passedQuizzes}/${mastery.totalQuizzes})`);
    if (mastery.eligible !== false) throw new Error('Expected eligible to be false initially');

    // 4. Pass each quiz one by one
    for (let i = 0; i < courseQuizzes.length; i++) {
      const q = courseQuizzes[i];
      await QuizAttempt.create({
        quiz: q._id,
        course: courseId,
        student: student._id,
        attemptNumber: 1,
        score: 10,
        totalPoints: 10,
        percentage: 100,
        passed: true,
        submittedAt: new Date(),
      });
      console.log(`Created passing attempt for quiz ${i + 1}: "${q.title}"`);
    }

    // 5. Verify that NOW all quizzes are passed and student IS eligible
    mastery = await evaluateCourseQuizMastery(courseId, student._id);
    console.log(`Post-quiz mastery eligible: ${mastery.eligible} (Passed: ${mastery.passedQuizzes}/${mastery.totalQuizzes})`);
    if (!mastery.eligible) throw new Error('Expected eligible to be true after passing all quizzes');

    // 6. Test PDF stream generation
    const tempPdfPath = path.resolve(__dirname, '../uploads/test_cert.pdf');
    const writeStream = fs.createWriteStream(tempPdfPath);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);

      generateCertificatePDFStream(
        {
          studentName: student.name,
          courseTitle: course.title,
          instructorName: course.instructor?.name || 'Lead Instructor',
          certificateId: 'CERT-2026-TEST-9999',
          issueDate: new Date(),
          averageScore: mastery.averageScore,
          quizzesCount: mastery.totalQuizzes,
        },
        writeStream
      );
    });

    const stats = fs.statSync(tempPdfPath);
    console.log(`Generated PDF certificate file at: ${tempPdfPath} (${stats.size} bytes)`);

    const fileHeader = fs.readFileSync(tempPdfPath, { encoding: 'utf8', flag: 'r' }).substring(0, 5);
    console.log(`PDF header check: "${fileHeader}"`);
    if (fileHeader !== '%PDF-') throw new Error('Invalid PDF format generated');

    // Clean up test file
    fs.unlinkSync(tempPdfPath);

    console.log('================================================');
    console.log('✅ CERTIFICATE GENERATION & PDF FLOW VERIFIED SUCCESSFULLY!');
    console.log('================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
};

testFlow();
