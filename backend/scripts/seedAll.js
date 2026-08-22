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
    const designCourse = seededCourses[2];

    const quizzesToSeed = [
      // --- MERN COURSE QUIZZES ---
      {
        course: mernCourse._id,
        moduleOrder: 1,
        title: 'Module 1 Knowledge Check: HTML5 & Tailwind Foundations',
        description: 'Test your understanding of semantic markup, Tailwind utility classes, and layout structures.',
        instructor: primaryInstructor._id,
        timeLimit: 10,
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
        maxAttempts: 0,
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
          {
            questionText: 'Which of the following hooks are used to memoize values and functions to prevent unnecessary recalculations or re-renders?',
            questionType: 'multiple_response',
            options: ['useMemo', 'useCallback', 'useRef', 'useLayoutEffect'],
            correctAnswers: [0, 1],
            points: 2,
            explanation: 'useMemo memoizes computed values, and useCallback memoizes callback functions.',
          },
        ],
      },
      {
        course: mernCourse._id,
        moduleOrder: 3,
        title: 'Module 3 Quiz: Node.js, Express & MongoDB Architecture',
        description: 'Evaluate your knowledge on RESTful routing, Express middleware pipelines, Mongoose models, and async error handling.',
        instructor: primaryInstructor._id,
        timeLimit: 15,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'In Express.js middleware functions, what is the purpose of invoking the next() callback?',
            questionType: 'multiple_choice',
            options: [
              'To send the HTTP response back to the client immediately',
              'To pass control to the next middleware function in the request-response cycle',
              'To terminate the Node.js server process',
              'To restart the Express routing engine',
            ],
            correctAnswers: [1],
            points: 1,
            explanation: 'Invoking next() hands over control to the subsequent middleware registered in the Express pipeline.',
          },
          {
            questionText: 'Which of the following are valid Mongoose Schema data types?',
            questionType: 'multiple_response',
            options: ['String', 'Number', 'mongoose.Schema.Types.ObjectId', 'Float64Array', 'Boolean'],
            correctAnswers: [0, 1, 2, 4],
            points: 2,
            explanation: 'Mongoose schema supports String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array, Decimal128, and Map.',
          },
          {
            questionText: 'MongoDB collections enforce a strict predefined column schema at the database engine level by default.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [1],
            points: 1,
            explanation: 'False. MongoDB is document-oriented and schemaless by default.',
          },
          {
            questionText: 'What standard HTTP status code represents an unauthorized request when authentication credentials are missing or invalid?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['401', '401 Unauthorized'],
            points: 1,
            explanation: 'HTTP 401 Unauthorized indicates that the request lacks valid authentication credentials.',
          },
          {
            questionText: 'Which Mongoose query method is used to automatically replace specified document paths with document(s) from other collections?',
            questionType: 'multiple_choice',
            options: ['.populate()', '.aggregate()', '.lookup()', '.join()'],
            correctAnswers: [0],
            points: 1,
            explanation: '.populate() is the Mongoose method used to populate referenced ObjectIds from other collections.',
          },
        ],
      },
      {
        course: mernCourse._id,
        moduleOrder: 4,
        title: 'Module 4 Assessment: JWT Authentication, Security & Cloud Deployment',
        description: 'Assess best practices in JSON Web Tokens, bcrypt password hashing, CORS, environment security, and production deployment.',
        instructor: primaryInstructor._id,
        timeLimit: 12,
        passingScore: 80,
        maxAttempts: 2,
        isPublished: true,
        shuffleQuestions: false,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'Where should sensitive production configuration values like JWT_SECRET and MONGODB_URI be stored?',
            questionType: 'multiple_choice',
            options: [
              'Hardcoded directly into server.js for quick access',
              'Committed to the public GitHub repository in a config.json file',
              'Environment variables (.env file loaded with dotenv, excluded in .gitignore)',
              'Stored inside localStorage in the frontend client browser',
            ],
            correctAnswers: [2],
            points: 1,
            explanation: 'Secrets should always reside in environment variables and never be checked into version control.',
          },
          {
            questionText: 'Which of the following are recommended security practices for Node.js / Express production applications?',
            questionType: 'multiple_response',
            options: [
              'Hashing user passwords using bcryptjs with a salt round of 10-12',
              'Implementing rate limiting to mitigate brute-force and DDoS attacks',
              'Using Helmet middleware to set HTTP security headers',
              'Returning raw database stack traces directly to the client in production error responses',
            ],
            correctAnswers: [0, 1, 2],
            points: 2,
            explanation: 'Bcrypt hashing, rate limiting, and security headers (Helmet) are standard practices.',
          },
          {
            questionText: 'JSON Web Tokens (JWTs) are fully encrypted by default, meaning anyone who captures a token cannot view the decoded payload without the secret key.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [1],
            points: 1,
            explanation: 'False. Standard JWTs are signed and Base64Url-encoded, NOT encrypted.',
          },
          {
            questionText: 'What npm library or algorithm is industry standard for hashing passwords with salted key derivation in Node.js?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['bcrypt', 'bcryptjs', 'argon2'],
            points: 1,
            explanation: 'bcrypt (and bcryptjs) is the industry standard password-hashing function.',
          },
        ],
      },
      {
        course: mernCourse._id,
        moduleOrder: null,
        title: 'Full-Stack MERN Midterm Certification Exam',
        description: 'Comprehensive milestone examination covering front-to-back engineering across React, Express, and MongoDB.',
        instructor: primaryInstructor._id,
        timeLimit: 25,
        passingScore: 75,
        maxAttempts: 2,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'What is the primary role of Cross-Origin Resource Sharing (CORS) headers in a MERN architecture?',
            questionType: 'multiple_choice',
            options: [
              'To compress JSON payloads over WebSocket connections',
              'To allow a web application running at one origin (e.g. Vite on port 5173) to securely request resources from a different origin (e.g. Express on port 5000)',
              'To automatically generate MongoDB schemas from frontend form fields',
              'To encrypt HTTP requests with SSL certificates',
            ],
            correctAnswers: [1],
            points: 1,
            explanation: 'CORS is a browser security mechanism that allows or restricts resource sharing between different origins.',
          },
          {
            questionText: 'Which React Hook is specifically designed for accessing URL route parameters configured in react-router-dom?',
            questionType: 'multiple_choice',
            options: ['useLocation', 'useNavigate', 'useParams', 'useSearchParams'],
            correctAnswers: [2],
            points: 1,
            explanation: 'useParams returns an object of key/value pairs of URL parameters.',
          },
          {
            questionText: 'An asynchronous Express route handler should handle promise rejections using try/catch blocks or pass errors to next(err).',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. Unhandled promise rejections can cause crashes or hangs if not caught.',
          },
          {
            questionText: 'What HTTP method should be used for updating only specific fields of an existing resource (partial update) in a REST API?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['PATCH', 'patch'],
            points: 1,
            explanation: 'PATCH is the HTTP method designated for applying partial modifications to a resource.',
          },
        ],
      },

      // --- MACHINE LEARNING COURSE QUIZZES ---
      {
        course: mlCourse._id,
        moduleOrder: 1,
        title: 'Python & NumPy Essentials Quiz',
        description: 'Quick check on NumPy vectorization, array broadcasting, and Pandas DataFrame manipulations.',
        instructor: primaryInstructor._id,
        timeLimit: 0,
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
          {
            questionText: 'Which Pandas method returns descriptive statistical summaries (mean, standard deviation, min, max, quartiles) for numeric columns?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['describe()', 'describe', 'df.describe()', 'df.describe'],
            points: 1,
            explanation: 'df.describe() generates summary statistics of DataFrame numerical series.',
          },
        ],
      },
      {
        course: mlCourse._id,
        moduleOrder: 2,
        title: 'Module 2 Assessment: Supervised Learning & Scikit-Learn Algorithms',
        description: 'Assess core supervised learning techniques: linear regression, logistic regression, decision trees, and loss functions.',
        instructor: primaryInstructor._id,
        timeLimit: 20,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'What is the key difference between regression and classification tasks in machine learning?',
            questionType: 'multiple_choice',
            options: [
              'Regression predicts continuous numeric values, while classification predicts discrete categorical classes',
              'Regression uses labeled data, while classification only uses unlabeled data',
              'Regression cannot be evaluated with metrics, while classification can',
              'Classification requires neural networks, while regression only uses linear equations',
            ],
            correctAnswers: [0],
            points: 1,
            explanation: 'Regression outputs continuous numerical values, whereas classification assigns inputs to discrete categories.',
          },
          {
            questionText: 'Which of the following algorithms are commonly used for classification problems?',
            questionType: 'multiple_response',
            options: [
              'Logistic Regression',
              'Random Forest Classifier',
              'Linear Regression',
              'Support Vector Classifier (SVC)',
            ],
            correctAnswers: [0, 1, 3],
            points: 2,
            explanation: 'Logistic Regression, Random Forest Classifier, and SVC are classification algorithms.',
          },
          {
            questionText: 'Overfitting occurs when a machine learning model memorizes noise in the training set and fails to generalize to unseen test data.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. High variance / overfitting leads to great training performance but poor generalization.',
          },
          {
            questionText: 'What metric represents the proportion of true positive predictions out of all actual positive samples in binary classification?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['recall', 'sensitivity', 'true positive rate'],
            points: 1,
            explanation: 'Recall = TP / (TP + FN), measuring how many actual positive instances were captured.',
          },
        ],
      },
      {
        course: mlCourse._id,
        moduleOrder: 3,
        title: 'Module 3 Quiz: Model Evaluation, Metrics & Hyperparameter Tuning',
        description: 'Test your understanding of cross-validation, confusion matrices, ROC-AUC curves, and hyperparameter search techniques.',
        instructor: primaryInstructor._id,
        timeLimit: 15,
        passingScore: 75,
        maxAttempts: 0,
        isPublished: true,
        shuffleQuestions: false,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'What is the primary benefit of K-Fold Cross-Validation over a single train/test split?',
            questionType: 'multiple_choice',
            options: [
              'It runs significantly faster on GPU hardware',
              'It provides a more reliable, variance-reduced estimate of model performance by evaluating across all data partitions',
              'It completely removes the need for hyperparameter tuning',
              'It guarantees 100% test accuracy',
            ],
            correctAnswers: [1],
            points: 1,
            explanation: 'K-Fold cross-validation ensures every data point is used for both training and validation.',
          },
          {
            questionText: 'Which of the following metrics are standard for evaluating regression models?',
            questionType: 'multiple_response',
            options: [
              'Mean Squared Error (MSE)',
              'Root Mean Squared Error (RMSE)',
              'F1-Score',
              'R-Squared (Coefficient of Determination)',
              'Log-Loss',
            ],
            correctAnswers: [0, 1, 3],
            points: 2,
            explanation: 'MSE, RMSE, and R-Squared evaluate continuous regression. F1-Score and Log-Loss evaluate classification.',
          },
          {
            questionText: 'A high bias machine learning model is typically underfitting the data.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. High bias indicates an overly simplistic model that cannot capture underlying data patterns (underfitting).',
          },
          {
            questionText: 'What scikit-learn model selection utility performs an exhaustive search over a specified parameter grid?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['GridSearchCV', 'GridSearch', 'gridsearchcv'],
            points: 1,
            explanation: 'GridSearchCV exhaustively evaluates combinations of hyperparameters with cross-validation.',
          },
        ],
      },

      // --- UI/UX DESIGN COURSE QUIZZES ---
      ...(designCourse
        ? [
            {
              course: designCourse._id,
              moduleOrder: 1,
              title: 'Module 1 Check: User Research, Personas & Wireframing',
              description: 'Evaluate foundational concepts in discovery research, user personas, empathy maps, and low-fidelity prototyping.',
              instructor: secondInstructor._id,
              timeLimit: 10,
              passingScore: 70,
              maxAttempts: 3,
              isPublished: true,
              shuffleQuestions: true,
              showCorrectAnswersAfterSubmission: true,
              questions: [
                {
                  questionText: 'What is the primary purpose of creating User Personas during the discovery phase of product design?',
                  questionType: 'multiple_choice',
                  options: [
                    'To dictate the final CSS stylesheet variables',
                    'To represent archetypes of target users based on research, helping teams design with empathy for real user needs',
                    'To estimate project engineering billing hours',
                    'To select photography for marketing banners',
                  ],
                  correctAnswers: [1],
                  points: 1,
                  explanation: 'Personas encapsulate user behaviors, goals, pain points, and demographics to guide user-centered decisions.',
                },
                {
                  questionText: 'Which methods are commonly used for qualitative user research?',
                  questionType: 'multiple_response',
                  options: [
                    '1-on-1 Semi-structured User Interviews',
                    'Usability Observation Sessions',
                    'Card Sorting',
                    'Database Query Benchmarking',
                  ],
                  correctAnswers: [0, 1, 2],
                  points: 2,
                  explanation: 'Interviews, observation sessions, and card sorting are foundational qualitative UX research methods.',
                },
                {
                  questionText: 'Low-fidelity wireframes should focus on visual branding, photography, and high-fidelity typography rather than layout and information architecture.',
                  questionType: 'true_false',
                  options: ['True', 'False'],
                  correctAnswers: [1],
                  points: 1,
                  explanation: 'False. Low-fidelity wireframes deliberately focus on layout, content structure, and user flow.',
                },
                {
                  questionText: 'What is the UX term for a visual timeline diagram showing the step-by-step path a user takes to reach a specific goal?',
                  questionType: 'short_answer',
                  options: [],
                  correctAnswers: ['user journey', 'user flow', 'user journey map', 'customer journey map'],
                  points: 1,
                  explanation: 'A user journey visualizes the sequence of steps a user takes across a product experience.',
                },
              ],
            },
            {
              course: designCourse._id,
              moduleOrder: 2,
              title: 'Module 2 Assessment: Visual Hierarchy, Color Theory & Typography',
              description: 'Assess your eye for typography scales, contrast ratios, accessibility (WCAG AA), and the 60-30-10 color rule.',
              instructor: secondInstructor._id,
              timeLimit: 15,
              passingScore: 75,
              maxAttempts: 2,
              isPublished: true,
              shuffleQuestions: false,
              showCorrectAnswersAfterSubmission: true,
              questions: [
                {
                  questionText: 'Which design principle arranges interface elements in a way that naturally leads the viewer’s eye in order of visual importance?',
                  questionType: 'multiple_choice',
                  options: ['Visual Hierarchy', 'Code Splitting', 'Color Inversion', 'Symmetric Redundancy'],
                  correctAnswers: [0],
                  points: 1,
                  explanation: 'Visual hierarchy guides user perception through size, contrast, weight, color, and whitespace.',
                },
                {
                  questionText: 'According to WCAG 2.1 AA accessibility guidelines, what is the minimum required contrast ratio for standard body text against its background?',
                  questionType: 'multiple_choice',
                  options: ['3:1', '4.5:1', '7:1', '10:1'],
                  correctAnswers: [1],
                  points: 1,
                  explanation: 'WCAG AA requires at least a 4.5:1 contrast ratio for normal text.',
                },
                {
                  questionText: 'Which techniques help establish strong contrast and hierarchy between text elements?',
                  questionType: 'multiple_response',
                  options: [
                    'Varying font weight (e.g. bold header vs regular body)',
                    'Adjusting typographic scale (e.g. 32px title vs 16px body)',
                    'Using contrasting text colors (e.g. dark slate vs muted gray)',
                    'Setting all text to uppercase italics at the same font size',
                  ],
                  correctAnswers: [0, 1, 2],
                  points: 2,
                  explanation: 'Font weight, typographic size scale, and intentional text colors establish clear visual hierarchy.',
                },
                {
                  questionText: 'In color theory for UI design, the 60-30-10 rule suggests using 60% dominant color, 30% secondary/supporting color, and what percentage for accent/call-to-action color?',
                  questionType: 'short_answer',
                  options: [],
                  correctAnswers: ['10%', '10', '10 percent'],
                  points: 1,
                  explanation: 'The remaining 10% is reserved for accent/action colors like primary buttons.',
                },
              ],
            },
            {
              course: designCourse._id,
              moduleOrder: 3,
              title: 'Module 3 Quiz: Figma Components, Auto-Layout & Design Tokens',
              description: 'Evaluate your technical mastery of Figma Auto-Layout (flex direction, padding, gap), component variants, and design tokens.',
              instructor: secondInstructor._id,
              timeLimit: 12,
              passingScore: 70,
              maxAttempts: 0,
              isPublished: true,
              shuffleQuestions: true,
              showCorrectAnswersAfterSubmission: true,
              questions: [
                {
                  questionText: 'Which Figma feature allows buttons and containers to automatically resize and maintain dynamic padding when their label changes?',
                  questionType: 'multiple_choice',
                  options: ['Auto Layout', 'Boolean Operation', 'Smart Animate', 'Vector Pen Tool'],
                  correctAnswers: [0],
                  points: 1,
                  explanation: 'Auto Layout is Figma’s flexbox-like feature that automatically handles dynamic resizing and padding.',
                },
                {
                  questionText: 'Which elements are standard components of a scalable design system?',
                  questionType: 'multiple_response',
                  options: [
                    'Color palette tokens (primary, neutral, semantic error/success)',
                    'Typography scale and line-height tokens',
                    'Reusable UI components (buttons, modals, inputs)',
                    'Random hex values hardcoded into individual screens',
                  ],
                  correctAnswers: [0, 1, 2],
                  points: 2,
                  explanation: 'Design systems provide standardized tokens for colors, typography, spacing, and reusable components.',
                },
                {
                  questionText: 'In Figma, when you modify the master Main Component, all instances across all artboards update automatically unless specifically overridden.',
                  questionType: 'true_false',
                  options: ['True', 'False'],
                  correctAnswers: [0],
                  points: 1,
                  explanation: 'True. Instances inherit properties from their Main Component, enabling instantaneous global updates.',
                },
                {
                  questionText: 'What Figma feature allows designers to bundle different states (hover, active, disabled) and sizes (sm, md, lg) of a component into a single container?',
                  questionType: 'short_answer',
                  options: [],
                  correctAnswers: ['variants', 'component variants', 'variant'],
                  points: 1,
                  explanation: 'Component Variants organize multiple related states and configurations into one unified component set.',
                },
              ],
            },
          ]
        : []),
    ];

    const seededQuizzes = [];
    for (const qData of quizzesToSeed) {
      let quiz = await Quiz.findOne({ course: qData.course, title: qData.title });
      if (!quiz) {
        quiz = await Quiz.create(qData);
        console.log(`  -> Created quiz: "${quiz.title}"`);
      } else {
        quiz.questions = qData.questions;
        quiz.moduleOrder = qData.moduleOrder;
        quiz.timeLimit = qData.timeLimit;
        quiz.passingScore = qData.passingScore;
        quiz.maxAttempts = qData.maxAttempts;
        quiz.isPublished = qData.isPublished;
        quiz.shuffleQuestions = qData.shuffleQuestions;
        quiz.showCorrectAnswersAfterSubmission = qData.showCorrectAnswersAfterSubmission;
        await quiz.save();
        console.log(`  -> Updated quiz: "${quiz.title}"`);
      }
      seededQuizzes.push(quiz);
    }

    // 9. Seed Student Quiz Attempts
    console.log('[Seed] Seeding student quiz attempts...');
    if (seededQuizzes.length > 0 && students.length >= 2) {
      for (let i = 0; i < seededQuizzes.length; i++) {
        const quiz = seededQuizzes[i];
        if (!quiz.questions || quiz.questions.length === 0) continue;

        // Student 1 (students[0]): High score attempt on quizzes
        if (i % 2 === 0 || i === 1) {
          const student0 = students[0];
          let attempt0 = await QuizAttempt.findOne({ quiz: quiz._id, student: student0._id, attemptNumber: 1 });
          if (!attempt0) {
            const answers = quiz.questions.map((q) => {
              let selectedOptions = [];
              let textAnswer = '';
              if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
                selectedOptions = [q.correctAnswers[0]];
              } else if (q.questionType === 'multiple_response') {
                selectedOptions = [...q.correctAnswers];
              } else if (q.questionType === 'short_answer') {
                textAnswer = String(q.correctAnswers[0]);
              }
              return {
                questionId: q._id,
                questionText: q.questionText,
                questionType: q.questionType,
                selectedOptions,
                textAnswer,
                isCorrect: true,
                pointsAwarded: q.points || 1,
                maxPoints: q.points || 1,
              };
            });

            const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
            const score = totalPoints;
            const percentage = 100;
            const passed = percentage >= quiz.passingScore;

            await QuizAttempt.create({
              quiz: quiz._id,
              course: quiz.course,
              student: student0._id,
              attemptNumber: 1,
              answers,
              score,
              totalPoints,
              percentage,
              passed,
              timeSpentSeconds: 120 + Math.floor(Math.random() * 150),
              submittedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            });
            console.log(`  -> Created passed attempt for ${student0.name} on "${quiz.title}"`);
          }
        }

        // Student 2 (students[1]): Varied score attempt
        if (students.length > 1 && (i === 0 || i % 3 === 0)) {
          const student1 = students[1];
          let attempt1 = await QuizAttempt.findOne({ quiz: quiz._id, student: student1._id, attemptNumber: 1 });
          if (!attempt1) {
            let totalPoints = 0;
            let score = 0;
            const answers = quiz.questions.map((q, idx) => {
              const maxP = q.points || 1;
              totalPoints += maxP;
              const isCorrect = idx !== 1; // 2nd question wrong
              let selectedOptions = [];
              let textAnswer = '';
              let pointsAwarded = 0;

              if (isCorrect) {
                pointsAwarded = maxP;
                score += pointsAwarded;
                if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
                  selectedOptions = [q.correctAnswers[0]];
                } else if (q.questionType === 'multiple_response') {
                  selectedOptions = [...q.correctAnswers];
                } else if (q.questionType === 'short_answer') {
                  textAnswer = String(q.correctAnswers[0]);
                }
              } else {
                pointsAwarded = 0;
                if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
                  selectedOptions = [0];
                } else if (q.questionType === 'multiple_response') {
                  selectedOptions = [0];
                } else if (q.questionType === 'short_answer') {
                  textAnswer = 'attempt answer';
                }
              }

              return {
                questionId: q._id,
                questionText: q.questionText,
                questionType: q.questionType,
                selectedOptions,
                textAnswer,
                isCorrect,
                pointsAwarded,
                maxPoints: maxP,
              };
            });

            const percentage = Math.round((score / totalPoints) * 100);
            const passed = percentage >= quiz.passingScore;

            await QuizAttempt.create({
              quiz: quiz._id,
              course: quiz.course,
              student: student1._id,
              attemptNumber: 1,
              answers,
              score,
              totalPoints,
              percentage,
              passed,
              timeSpentSeconds: 160 + Math.floor(Math.random() * 120),
              submittedAt: new Date(Date.now() - (i + 0.5) * 24 * 60 * 60 * 1000),
            });
            console.log(`  -> Created attempt (${percentage}%) for ${student1.name} on "${quiz.title}"`);
          }
        }
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
