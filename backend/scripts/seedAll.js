import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const categoriesData = [
  { name: 'Web Development', description: 'Frontend, backend, and full-stack web engineering.' },
  { name: 'Data Science', description: 'Machine learning, statistics, data analytics, and Python.' },
  { name: 'UI/UX Design', description: 'User interface design, Figma wireframing, and user research.' },
  { name: 'Cybersecurity', description: 'Ethical hacking, network defense, and system security.' },
];

const seedComprehensiveData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // 1. Seed Instructors
    console.log('[Seed] Ensuring instructors exist...');
    let primaryInstructor = await User.findOne({ email: 'instructor@pathway.com' });
    if (!primaryInstructor) {
      primaryInstructor = await User.create({
        name: 'Dr. Angela Vance',
        email: 'instructor@pathway.com',
        password: 'instructorPass123',
        role: 'instructor',
        status: 'active',
      });
      console.log('  -> Created primary instructor: instructor@pathway.com');
    }

    let secondInstructor = await User.findOne({ email: 'instructor1@pathway.com' });
    if (!secondInstructor) {
      secondInstructor = await User.create({
        name: 'Prof. David Miller',
        email: 'instructor1@pathway.com',
        password: 'instructorPass123',
        role: 'instructor',
        status: 'active',
      });
      console.log('  -> Created secondary instructor: instructor1@pathway.com');
    }

    // 2. Seed Students
    console.log('[Seed] Ensuring students exist...');
    const students = [];
    for (let i = 1; i <= 5; i++) {
      let student = await User.findOne({ email: `student${i}@pathway.com` });
      if (!student) {
        student = await User.create({
          name: `Student Demo ${i}`,
          email: `student${i}@pathway.com`,
          password: 'studentPass123',
          role: 'student',
          status: 'active',
        });
        console.log(`  -> Created student: student${i}@pathway.com`);
      }
      students.push(student);
    }

    // 3. Seed Categories
    console.log('[Seed] Ensuring categories exist...');
    const categoryMap = {};
    for (const cat of categoriesData) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        category = await Category.create({ ...cat, createdBy: primaryInstructor._id });
        console.log(`  -> Created category: ${category.name}`);
      }
      categoryMap[cat.name] = category._id;
    }

    // 4. Seed Courses with Modules
    console.log('[Seed] Seeding rich courses...');
    const coursesToSeed = [
      {
        title: 'Full-Stack Web Development with MERN',
        description:
          'Comprehensive course covering React 19, Node.js, Express, MongoDB Atlas, RESTful API design, authentication with JWT, and deployment on modern cloud platforms.',
        category: categoryMap['Web Development'],
        instructor: primaryInstructor._id,
        level: 'intermediate',
        price: 0,
        status: 'published',
        modules: [
          { order: 1, title: 'HTML5, Modern CSS & Tailwind Foundations', description: 'Semantic tags, flexbox, responsive grids, and design tokens.' },
          { order: 2, title: 'JavaScript (ES6+) & React Components', description: 'Hooks, state management, routing, and effects.' },
          { order: 3, title: 'Node.js, Express & MongoDB Backend', description: 'REST APIs, mongoose models, CRUD operations, and middleware.' },
          { order: 4, title: 'Authentication, Security & Deployment', description: 'JWT authentication, password hashing, and deployment pipelines.' },
        ],
      },
      {
        title: 'Machine Learning & Data Science with Python',
        description:
          'Practical machine learning from scratch. Master NumPy, Pandas, Scikit-learn, regression algorithms, classification, neural networks, and model performance metrics.',
        category: categoryMap['Data Science'],
        instructor: primaryInstructor._id,
        level: 'beginner',
        price: 1500,
        status: 'published',
        modules: [
          { order: 1, title: 'Python for Data Analysis: NumPy & Pandas', description: 'Data structures, cleaning, grouping, and exploratory data analysis.' },
          { order: 2, title: 'Supervised Learning: Regression & Classification', description: 'Linear models, decision trees, random forests, and metrics.' },
          { order: 3, title: 'Model Evaluation & Hyperparameter Tuning', description: 'Cross-validation, ROC-AUC, precision-recall, and grid search.' },
        ],
      },
      {
        title: 'UI/UX Design Systems with Figma',
        description:
          'Master user interface design, user research, wireframing, color psychology, and scalable design systems in Figma.',
        category: categoryMap['UI/UX Design'],
        instructor: secondInstructor._id,
        level: 'beginner',
        price: 0,
        status: 'published',
        modules: [
          { order: 1, title: 'User Research & Wireframing', description: 'User personas, user journeys, low-fidelity wireframes.' },
          { order: 2, title: 'Visual Hierarchy, Typography & Colors', description: 'Applying design theory to modern digital products.' },
          { order: 3, title: 'Interactive Prototyping & Design Systems', description: 'Figma components, auto-layout, tokens, and handover.' },
        ],
      },
    ];

    const seededCourses = [];
    for (const courseData of coursesToSeed) {
      let course = await Course.findOne({ title: courseData.title });
      if (!course) {
        course = await Course.create(courseData);
        console.log(`  -> Created course: ${course.title}`);
      } else {
        // Update modules if empty
        if (!course.modules || course.modules.length === 0) {
          course.modules = courseData.modules;
          await course.save();
        }
      }
      seededCourses.push(course);
    }

    // 5. Seed Enrollments
    console.log('[Seed] Enrolling students in courses...');
    for (const course of seededCourses) {
      let enrolledCount = 0;
      for (const student of students) {
        let enrollment = await Enrollment.findOne({ course: course._id, student: student._id });
        if (!enrollment) {
          enrollment = await Enrollment.create({
            course: course._id,
            student: student._id,
            status: 'active',
            progress: 45,
          });
          console.log(`  -> Enrolled ${student.name} into "${course.title}"`);
        }
        enrolledCount++;
      }
      course.enrolledCount = enrolledCount;
      await course.save();
    }

    // 6. Seed Assignments
    console.log('[Seed] Seeding assignments...');
    const mernCourse = seededCourses[0];
    const mlCourse = seededCourses[1];

    const assignmentsToSeed = [
      {
        course: mernCourse._id,
        title: 'Assignment 1: Responsive Portfolio in React',
        description:
          'Create a 3-page responsive developer portfolio using React 19 and Tailwind CSS. Ensure mobile responsiveness and clean component architecture.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxMarks: 100,
        createdBy: primaryInstructor._id,
        status: 'published',
      },
      {
        course: mernCourse._id,
        title: 'Assignment 2: RESTful Express API with Authentication',
        description:
          'Build a Node/Express backend with JWT login/signup, password hashing with bcryptjs, and protected CRUD endpoints for a blog application.',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        maxMarks: 100,
        createdBy: primaryInstructor._id,
        status: 'published',
      },
      {
        course: mlCourse._id,
        title: 'Assignment 1: Housing Price Prediction Model',
        description:
          'Train and evaluate a Linear Regression and Random Forest model on the California Housing dataset. Submit your Jupyter notebook with evaluation metrics.',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        maxMarks: 50,
        createdBy: primaryInstructor._id,
        status: 'published',
      },
    ];

    const seededAssignments = [];
    for (const assignData of assignmentsToSeed) {
      let assign = await Assignment.findOne({ course: assignData.course, title: assignData.title });
      if (!assign) {
        assign = await Assignment.create(assignData);
        console.log(`  -> Created assignment: "${assign.title}"`);
      }
      seededAssignments.push(assign);
    }

    // 7. Seed Assignment Submissions
    console.log('[Seed] Seeding student assignment submissions...');
    if (seededAssignments.length > 0 && students.length >= 2) {
      const targetAssign = seededAssignments[0];
      
      // Submission 1: Graded
      const existingSub1 = await AssignmentSubmission.findOne({
        assignment: targetAssign._id,
        student: students[0]._id,
      });
      if (!existingSub1) {
        await AssignmentSubmission.create({
          assignment: targetAssign._id,
          course: targetAssign.course,
          student: students[0]._id,
          submissionText: 'GitHub Repo: https://github.com/student/portfolio\nLive demo deployed on Vercel.',
          marks: 94,
          feedback: 'Excellent work! Clean component breakdown, responsive navigation, and well-structured CSS tokens.',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });
        console.log(`  -> Created graded submission for ${students[0].name}`);
      }

      // Submission 2: Pending grading
      const existingSub2 = await AssignmentSubmission.findOne({
        assignment: targetAssign._id,
        student: students[1]._id,
      });
      if (!existingSub2) {
        await AssignmentSubmission.create({
          assignment: targetAssign._id,
          course: targetAssign.course,
          student: students[1]._id,
          submissionText: 'Here is my portfolio submission with dark mode support and custom animations.',
          marks: null,
          feedback: '',
          submittedAt: new Date(),
        });
        console.log(`  -> Created pending submission for ${students[1].name}`);
      }
    }

    // 8. Seed Quizzes
    console.log('[Seed] Seeding interactive quizzes...');
    const quizzesToSeed = [
      {
        course: mernCourse._id,
        moduleOrder: 1,
        title: 'Module 1 Knowledge Check: HTML5 & Tailwind Foundations',
        description: 'Test your understanding of semantic markup, Tailwind utility classes, and layout structures.',
        instructor: primaryInstructor._id,
        timeLimit: 10, // 10 minutes
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'Which HTML5 semantic element should be used to represent independent, self-contained content?',
            questionType: 'multiple_choice',
            options: ['<section>', '<article>', '<div>', '<aside>'],
            correctAnswers: [1],
            points: 1,
            explanation: '<article> is designed for standalone, reusable content such as blog posts or cards.',
          },
          {
            questionText: 'Which of the following Tailwind CSS utility classes apply flexbox layout?',
            questionType: 'multiple_response',
            options: ['flex', 'inline-flex', 'grid', 'items-center'],
            correctAnswers: [0, 1, 3],
            points: 2,
            explanation: '"flex", "inline-flex", and "items-center" are flexbox utilities in Tailwind.',
          },
          {
            questionText: 'CSS Grid requires both display: grid and at least one grid-template property to function.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [1],
            points: 1,
            explanation: 'False. An element with display: grid will create single-column rows by default without explicit grid-template.',
          },
          {
            questionText: 'What is the Tailwind CSS prefix used for styling the hover state of an element?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['hover:', 'hover'],
            points: 1,
            explanation: 'The hover: prefix enables pseudo-class styling on hover in Tailwind CSS.',
          },
        ],
      },
      {
        course: mernCourse._id,
        moduleOrder: 2,
        title: 'Module 2 Assessment: React 19 Hooks & State Management',
        description: 'Comprehensive evaluation of React components, hooks (useState, useEffect, useMemo), and lifecycle.',
        instructor: primaryInstructor._id,
        timeLimit: 15,
        passingScore: 75,
        maxAttempts: 0, // unlimited
        isPublished: true,
        shuffleQuestions: false,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'Which React hook should you use to perform side effects like fetching data or setting timers?',
            questionType: 'multiple_choice',
            options: ['useState', 'useReducer', 'useEffect', 'useCallback'],
            correctAnswers: [2],
            points: 1,
            explanation: 'useEffect handles side effects in React functional components.',
          },
          {
            questionText: 'State updates in React functional components using the useState setter trigger a re-render of the component.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. Updating state informs React to schedule a component re-render with updated values.',
          },
          {
            questionText: 'What parameter must be passed as the second argument to useEffect to run it only once on mount?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['[]', 'empty array', 'an empty array'],
            points: 1,
            explanation: 'An empty dependency array [] tells React to run the effect once after initial render.',
          },
        ],
      },
      {
        course: mlCourse._id,
        moduleOrder: 1,
        title: 'Python & NumPy Essentials Quiz',
        description: 'Quick check on NumPy vectorization, array broadcasting, and Pandas DataFrame manipulations.',
        instructor: primaryInstructor._id,
        timeLimit: 0, // untimed
        passingScore: 60,
        maxAttempts: 2,
        isPublished: true,
        shuffleQuestions: false,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'Which NumPy function is used to create an array with values evenly spaced on a linear scale?',
            questionType: 'multiple_choice',
            options: ['np.arange', 'np.linspace', 'np.zeros', 'np.random'],
            correctAnswers: [1],
            points: 1,
            explanation: 'np.linspace(start, stop, num) generates num evenly spaced samples over [start, stop].',
          },
          {
            questionText: 'NumPy operations are implemented in C and vectorized, making them substantially faster than standard Python loops.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. NumPy uses vectorized C-level operations for high performance numerical computation.',
          },
        ],
      },
    ];

    const seededQuizzes = [];
    for (const qData of quizzesToSeed) {
      let quiz = await Quiz.findOne({ course: qData.course, title: qData.title });
      if (!quiz) {
        quiz = await Quiz.create(qData);
        console.log(`  -> Created quiz: "${quiz.title}"`);
      }
      seededQuizzes.push(quiz);
    }

    // 9. Seed Student Quiz Attempts
    console.log('[Seed] Seeding student quiz attempts...');
    if (seededQuizzes.length > 0 && students.length >= 2) {
      const quiz1 = seededQuizzes[0];

      // Student 1: Passed attempt
      const existingAttempt1 = await QuizAttempt.findOne({ quiz: quiz1._id, student: students[0]._id });
      if (!existingAttempt1) {
        await QuizAttempt.create({
          quiz: quiz1._id,
          course: quiz1.course,
          student: students[0]._id,
          attemptNumber: 1,
          answers: [
            {
              questionId: quiz1.questions[0]._id,
              questionText: quiz1.questions[0].questionText,
              questionType: 'multiple_choice',
              selectedOptions: [1],
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
            {
              questionId: quiz1.questions[1]._id,
              questionText: quiz1.questions[1].questionText,
              questionType: 'multiple_response',
              selectedOptions: [0, 1, 3],
              isCorrect: true,
              pointsAwarded: 2,
              maxPoints: 2,
            },
            {
              questionId: quiz1.questions[2]._id,
              questionText: quiz1.questions[2].questionText,
              questionType: 'true_false',
              selectedOptions: [1],
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
            {
              questionId: quiz1.questions[3]._id,
              questionText: quiz1.questions[3].questionText,
              questionType: 'short_answer',
              textAnswer: 'hover:',
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
          ],
          score: 5,
          totalPoints: 5,
          percentage: 100,
          passed: true,
          timeSpentSeconds: 180,
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        });
        console.log(`  -> Created passed quiz attempt (100%) for ${students[0].name}`);
      }

      // Student 2: Partial attempt
      const existingAttempt2 = await QuizAttempt.findOne({ quiz: quiz1._id, student: students[1]._id });
      if (!existingAttempt2) {
        await QuizAttempt.create({
          quiz: quiz1._id,
          course: quiz1.course,
          student: students[1]._id,
          attemptNumber: 1,
          answers: [
            {
              questionId: quiz1.questions[0]._id,
              questionText: quiz1.questions[0].questionText,
              questionType: 'multiple_choice',
              selectedOptions: [1],
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
            {
              questionId: quiz1.questions[1]._id,
              questionText: quiz1.questions[1].questionText,
              questionType: 'multiple_response',
              selectedOptions: [0, 1], // missing option 3
              isCorrect: false,
              pointsAwarded: 0,
              maxPoints: 2,
            },
            {
              questionId: quiz1.questions[2]._id,
              questionText: quiz1.questions[2].questionText,
              questionType: 'true_false',
              selectedOptions: [1],
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
            {
              questionId: quiz1.questions[3]._id,
              questionText: quiz1.questions[3].questionText,
              questionType: 'short_answer',
              textAnswer: 'hover',
              isCorrect: true,
              pointsAwarded: 1,
              maxPoints: 1,
            },
          ],
          score: 3,
          totalPoints: 5,
          percentage: 60,
          passed: false,
          timeSpentSeconds: 240,
          submittedAt: new Date(),
        });
        console.log(`  -> Created quiz attempt (60%) for ${students[1].name}`);
      }
    }

    console.log('====================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Credentials Summary:');
    console.log('  Instructor: instructor@pathway.com / instructorPass123');
    console.log('  Instructor: instructor1@pathway.com / instructorPass123');
    console.log('  Student 1:  student1@pathway.com / studentPass123');
    console.log('  Student 2:  student2@pathway.com / studentPass123');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error] ${err.message}`);
    process.exit(1);
  }
};

seedComprehensiveData();
