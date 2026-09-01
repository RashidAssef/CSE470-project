import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedQuizzes = async () => {
  try {
    console.log('[Seed Quizzes] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed Quizzes] Connected successfully.');

    // Fetch instructors
    let instructor = await User.findOne({ email: 'instructor@pathway.com' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'instructor' });
    }
    let secondInstructor = await User.findOne({ email: 'instructor1@pathway.com' }) || instructor;

    if (!instructor) {
      console.error('[Seed Quizzes] No instructor found. Please run seedAll.js or seedUsers.js first.');
      process.exit(1);
    }

    // Fetch students for attempts
    const students = await User.find({ role: 'student' }).limit(5);

    // Fetch courses
    const courses = await Course.find();
    if (courses.length === 0) {
      console.error('[Seed Quizzes] No courses found. Please run seedAll.js or seedCourses.js first.');
      process.exit(1);
    }

    const mernCourse = courses.find((c) => c.title.includes('MERN') || c.title.includes('Full-Stack'));
    const mlCourse = courses.find((c) => c.title.includes('Machine Learning') || c.title.includes('Python'));
    const designCourse = courses.find((c) => c.title.includes('UI/UX') || c.title.includes('Design'));
    const cyberCourse = courses.find((c) => c.title.includes('Ethical Hacking') || c.title.includes('Cybersecurity'));
    const reactCourse = courses.find((c) => c.title.includes('Advanced React'));

    const quizzesToInsert = [];

    // =========================================================================
    // 1. FULL-STACK MERN COURSE QUIZZES
    // =========================================================================
    if (mernCourse) {
      quizzesToInsert.push(
        {
          course: mernCourse._id,
          moduleOrder: 1,
          title: 'Module 1 Knowledge Check: HTML5 & Tailwind Foundations',
          description: 'Test your understanding of semantic markup, Tailwind utility classes, and layout structures.',
          instructor: mernCourse.instructor || instructor._id,
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
              explanation: '<article> is designed for standalone, reusable content such as blog posts, cards, or articles.',
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
          instructor: mernCourse.instructor || instructor._id,
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
              questionText: 'What parameter must be passed as the second argument to useEffect to run it only once on initial mount?',
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
          instructor: mernCourse.instructor || instructor._id,
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
              options: [
                'String',
                'Number',
                'mongoose.Schema.Types.ObjectId',
                'Float64Array',
                'Boolean',
              ],
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
              explanation: 'False. MongoDB is document-oriented and schemaless by default. Schema validation in MERN is typically managed via Mongoose schemas at the application layer.',
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
          instructor: mernCourse.instructor || instructor._id,
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
              explanation: 'Bcrypt hashing, rate limiting, and security headers (Helmet) are standard practices. Database stack traces should be withheld from production clients.',
            },
            {
              questionText: 'JSON Web Tokens (JWTs) are fully encrypted by default, meaning anyone who captures a token cannot view the decoded payload without the secret key.',
              questionType: 'true_false',
              options: ['True', 'False'],
              correctAnswers: [1],
              points: 1,
              explanation: 'False. Standard JWTs are signed and Base64Url-encoded, NOT encrypted. The payload is readable by anyone; the signature only verifies integrity.',
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
          instructor: mernCourse.instructor || instructor._id,
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
              explanation: 'True. Unhandled promise rejections can cause unhandled exceptions or hangs if not forwarded to Express error handling middleware.',
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
        }
      );
    }

    // =========================================================================
    // 2. MACHINE LEARNING & DATA SCIENCE COURSE QUIZZES
    // =========================================================================
    if (mlCourse) {
      quizzesToInsert.push(
        {
          course: mlCourse._id,
          moduleOrder: 1,
          title: 'Python & NumPy Essentials Quiz',
          description: 'Quick check on NumPy vectorization, array broadcasting, and Pandas DataFrame manipulations.',
          instructor: mlCourse.instructor || instructor._id,
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
          instructor: mlCourse.instructor || instructor._id,
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
              explanation: 'Regression outputs continuous numerical values (e.g. house price), whereas classification assigns inputs to discrete classes (e.g. spam/ham).',
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
              explanation: 'Logistic Regression, Random Forest Classifier, and SVC are classification algorithms. Linear Regression is used for continuous regression.',
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
              explanation: 'Recall (Sensitivity) = TP / (TP + FN), measuring how many actual positive instances were captured.',
            },
          ],
        },
        {
          course: mlCourse._id,
          moduleOrder: 3,
          title: 'Module 3 Quiz: Model Evaluation, Metrics & Hyperparameter Tuning',
          description: 'Test your understanding of cross-validation, confusion matrices, ROC-AUC curves, and hyperparameter search techniques.',
          instructor: mlCourse.instructor || instructor._id,
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
              explanation: 'K-Fold cross-validation ensures every data point is used for both training and validation, reducing variance in performance estimation.',
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
        }
      );
    }

    // =========================================================================
    // 3. UI/UX DESIGN SYSTEMS WITH FIGMA COURSE QUIZZES
    // =========================================================================
    if (designCourse) {
      quizzesToInsert.push(
        {
          course: designCourse._id,
          moduleOrder: 1,
          title: 'Module 1 Check: User Research, Personas & Wireframing',
          description: 'Evaluate foundational concepts in discovery research, user personas, empathy maps, and low-fidelity prototyping.',
          instructor: designCourse.instructor || secondInstructor._id,
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
              explanation: 'Personas encapsulate user behaviors, goals, pain points, and demographics to guide user-centered design decisions.',
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
              explanation: 'False. Low-fidelity wireframes deliberately focus on layout, content structure, and user flow without visual design distractions.',
            },
            {
              questionText: 'What is the UX term for a visual timeline diagram showing the step-by-step path a user takes to reach a specific goal?',
              questionType: 'short_answer',
              options: [],
              correctAnswers: ['user journey', 'user flow', 'user journey map', 'customer journey map'],
              points: 1,
              explanation: 'A user journey (or user flow / journey map) visualizes the sequence of steps a user takes across a product experience.',
            },
          ],
        },
        {
          course: designCourse._id,
          moduleOrder: 2,
          title: 'Module 2 Assessment: Visual Hierarchy, Color Theory & Typography',
          description: 'Assess your eye for typography scales, contrast ratios, accessibility (WCAG AA), and the 60-30-10 color rule.',
          instructor: designCourse.instructor || secondInstructor._id,
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
              explanation: 'WCAG AA requires at least a 4.5:1 contrast ratio for normal text and 3:1 for large text (18pt+ or 14pt bold).',
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
              explanation: 'The remaining 10% is reserved for accent/action colors like primary buttons and key highlights.',
            },
          ],
        },
        {
          course: designCourse._id,
          moduleOrder: 3,
          title: 'Module 3 Quiz: Figma Components, Auto-Layout & Design Tokens',
          description: 'Evaluate your technical mastery of Figma Auto-Layout (flex direction, padding, gap), component variants, and design tokens.',
          instructor: designCourse.instructor || secondInstructor._id,
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
              explanation: 'Auto Layout is Figma’s flexbox-like feature that automatically handles dynamic resizing, margins, and padding.',
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
              explanation: 'Component Variants organize multiple related states and configurations into one unified Figma component set.',
            },
          ],
        }
      );
    }

    // =========================================================================
    // 4. CYBERSECURITY COURSE QUIZ (if course exists)
    // =========================================================================
    if (cyberCourse) {
      quizzesToInsert.push({
        course: cyberCourse._id,
        moduleOrder: 1,
        title: 'Cybersecurity Fundamentals & Network Defense Quiz',
        description: 'Assess foundational concepts in threat modeling, OWASP Top 10 vulnerabilities, encryption, and pen-testing methodology.',
        instructor: cyberCourse.instructor || instructor._id,
        timeLimit: 15,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'What type of security attack involves an adversary secretly relaying and altering communications between two parties who believe they are communicating directly?',
            questionType: 'multiple_choice',
            options: [
              'Man-in-the-Middle (MitM) Attack',
              'SQL Injection',
              'Denial of Service (DoS)',
              'Buffer Overflow',
            ],
            correctAnswers: [0],
            points: 1,
            explanation: 'In a Man-in-the-Middle (MitM) attack, the attacker intercepts and potentially alters communication between two endpoints.',
          },
          {
            questionText: 'Which of the following are recognized vulnerabilities in the OWASP Top 10 web application security risks?',
            questionType: 'multiple_response',
            options: [
              'Broken Access Control',
              'Cryptographic Failures',
              'Injection (SQL, NoSQL, OS command)',
              'Semantic HTML5 Tags',
            ],
            correctAnswers: [0, 1, 2],
            points: 2,
            explanation: 'Broken Access Control, Cryptographic Failures, and Injection are top OWASP vulnerabilities.',
          },
          {
            questionText: 'HTTPS encrypts web traffic using Transport Layer Security (TLS), preventing third parties on the local network from reading payload contents in plaintext.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. TLS provides encryption, integrity, and authentication for HTTP communications.',
          },
          {
            questionText: 'What is the professional practice of authorized simulated cyberattacks against a computer system to evaluate its security called?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['penetration testing', 'pen testing', 'ethical hacking'],
            points: 1,
            explanation: 'Penetration testing (or ethical hacking) systematically tests for vulnerabilities under authorized conditions.',
          },
        ],
      });
    }

    // =========================================================================
    // 5. ADVANCED REACT QUIZ (if course exists)
    // =========================================================================
    if (reactCourse) {
      quizzesToInsert.push({
        course: reactCourse._id,
        moduleOrder: 1,
        title: 'Advanced State Management: Redux Toolkit & Context API',
        description: 'Test your understanding of global state architectures, slices, thunks, and memoized selectors with Reselect.',
        instructor: reactCourse.instructor || instructor._id,
        timeLimit: 15,
        passingScore: 75,
        maxAttempts: 2,
        isPublished: true,
        shuffleQuestions: true,
        showCorrectAnswersAfterSubmission: true,
        questions: [
          {
            questionText: 'What Redux Toolkit utility function allows you to define reducer logic and action creators together in one place?',
            questionType: 'multiple_choice',
            options: ['createSlice', 'createStore', 'combineReducers', 'createContext'],
            correctAnswers: [0],
            points: 1,
            explanation: 'createSlice auto-generates action types and action creators based on the reducers defined.',
          },
          {
            questionText: 'Redux Toolkit uses Immer under the hood, enabling you to write "mutating" logic inside reducers that safely produces immutable state updates.',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswers: [0],
            points: 1,
            explanation: 'True. Immer intercepts draft mutations and returns freshly copied immutable state trees.',
          },
          {
            questionText: 'What Redux Toolkit function is commonly used for creating asynchronous thunk action creators (e.g. for fetching data from an API)?',
            questionType: 'short_answer',
            options: [],
            correctAnswers: ['createAsyncThunk', 'createasyncthunk'],
            points: 1,
            explanation: 'createAsyncThunk handles pending, fulfilled, and rejected promise lifecycle actions automatically.',
          },
        ],
      });
    }

    // =========================================================================
    // DB INSERTION & UPSERT
    // =========================================================================
    console.log(`[Seed Quizzes] Processing ${quizzesToInsert.length} total quizzes...`);
    const seededQuizzes = [];

    for (const qData of quizzesToInsert) {
      let existingQuiz = await Quiz.findOne({ course: qData.course, title: qData.title });
      if (!existingQuiz) {
        existingQuiz = await Quiz.create(qData);
        console.log(`  -> Created quiz: "${existingQuiz.title}"`);
      } else {
        // Update existing quiz with complete questions and updated parameters
        existingQuiz.questions = qData.questions;
        existingQuiz.moduleOrder = qData.moduleOrder;
        existingQuiz.timeLimit = qData.timeLimit;
        existingQuiz.passingScore = qData.passingScore;
        existingQuiz.maxAttempts = qData.maxAttempts;
        existingQuiz.isPublished = qData.isPublished;
        existingQuiz.shuffleQuestions = qData.shuffleQuestions;
        existingQuiz.showCorrectAnswersAfterSubmission = qData.showCorrectAnswersAfterSubmission;
        await existingQuiz.save();
        console.log(`  -> Updated existing quiz: "${existingQuiz.title}"`);
      }
      seededQuizzes.push(existingQuiz);
    }

    // =========================================================================
    // SEED REALISTIC STUDENT ATTEMPTS
    // =========================================================================
    if (seededQuizzes.length > 0 && students.length >= 2) {
      console.log('[Seed Quizzes] Seeding realistic student quiz attempts...');

      for (let i = 0; i < seededQuizzes.length; i++) {
        const quiz = seededQuizzes[i];
        if (!quiz.questions || quiz.questions.length === 0) continue;

        // Student 0: Passed attempt on every even quiz
        if (i % 2 === 0) {
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
                pointsAwarded: q.points,
                maxPoints: q.points,
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
              timeSpentSeconds: 120 + Math.floor(Math.random() * 180),
              submittedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            });
            console.log(`    -> Created passed attempt for ${student0.name} on "${quiz.title}"`);
          }
        }

        // Student 1: Attempt on every quiz (sometimes 80%, sometimes 60%)
        if (students.length > 1) {
          const student1 = students[1];
          let attempt1 = await QuizAttempt.findOne({ quiz: quiz._id, student: student1._id, attemptNumber: 1 });
          if (!attempt1) {
            let totalPoints = 0;
            let score = 0;
            const answers = quiz.questions.map((q, idx) => {
              totalPoints += q.points || 1;
              let isCorrect = idx !== 1; // get the 2nd question wrong on purpose
              let selectedOptions = [];
              let textAnswer = '';
              let pointsAwarded = 0;

              if (isCorrect) {
                pointsAwarded = q.points || 1;
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
                  selectedOptions = [0]; // potentially incorrect
                } else if (q.questionType === 'multiple_response') {
                  selectedOptions = [0]; // partial/wrong
                } else if (q.questionType === 'short_answer') {
                  textAnswer = 'incorrect attempt';
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
                maxPoints: q.points || 1,
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
              timeSpentSeconds: 150 + Math.floor(Math.random() * 200),
              submittedAt: new Date(Date.now() - (i + 0.5) * 24 * 60 * 60 * 1000),
            });
            console.log(`    -> Created attempt (${percentage}%) for ${student1.name} on "${quiz.title}"`);
          }
        }
      }
    }

    console.log('====================================================');
    console.log(`🎉 QUIZ SEEDING COMPLETE: ${seededQuizzes.length} Quizzes Seeded!`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Quizzes Error] ${err.message}`);
    process.exit(1);
  }
};

seedQuizzes();
