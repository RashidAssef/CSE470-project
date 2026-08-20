import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  BarChart3,
  CircleCheck,
  Loader2,
  ListOrdered,
  FileText,
  Upload,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import FilePicker from '../components/FilePicker.jsx';
import QuizPlayerModal from '../components/QuizPlayerModal.jsx';
import QuizResultModal from '../components/QuizResultModal.jsx';
import {
  courseService,
  enrollmentService,
  authService,
  courseFileService,
  quizService,
  UPLOADS_BASE_URL,
} from '../services/api.js';

const levelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [materials, setMaterials] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Quizzes state
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuizForTaking, setActiveQuizForTaking] = useState(null);
  const [activeAttemptForReview, setActiveAttemptForReview] = useState(null);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await courseService.getCourseById(id);
      setCourse(data);

      try {
        const mats = await courseFileService.getMaterials(id);
        setMaterials(mats);
      } catch {
        setMaterials([]);
      }

      // Fetch Quizzes for this course
      try {
        const qList = await quizService.getCourseQuizzes(id);
        setQuizzes(qList || []);
      } catch {
        setQuizzes([]);
      }

      // Only students who are logged in can have an enrollment status
      if (currentUser?.role === 'student') {
        const status = await enrollmentService.getEnrollmentStatus(id);
        setEnrolled(status.enrolled);
        setEnrollmentId(status.enrollmentId);
        if (status.enrolled) {
          const subs = await courseFileService.getMySubmissions(id);
          setMySubmissions(subs);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEnroll = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'student') {
      setActionMessage('Only student accounts can enroll in courses.');
      return;
    }

    setActionLoading(true);
    setActionMessage('');
    try {
      const res = await enrollmentService.enroll(id);
      setEnrolled(true);
      setEnrollmentId(res.data._id);
      setCourse((prev) => ({ ...prev, enrolledCount: prev.enrolledCount + 1 }));
      setActionMessage(res.message);
      // Reload quizzes to get student attempt status
      const qList = await quizService.getCourseQuizzes(id);
      setQuizzes(qList || []);
    } catch (err) {
      setActionMessage(err.message || 'Could not enroll in this course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setActionLoading(true);
    setActionMessage('');
    try {
      await enrollmentService.unenroll(enrollmentId);
      setEnrolled(false);
      setEnrollmentId(null);
      setCourse((prev) => ({ ...prev, enrolledCount: Math.max(0, prev.enrolledCount - 1) }));
      setActionMessage('You have unenrolled from this course.');
    } catch (err) {
      setActionMessage(err.message || 'Could not unenroll from this course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitFile || !submitTitle.trim()) return;
    setSubmitLoading(true);
    setActionMessage('');
    try {
      await courseFileService.uploadSubmission(id, submitFile, submitTitle.trim());
      const subs = await courseFileService.getMySubmissions(id);
      setMySubmissions(subs);
      setSubmitTitle('');
      setSubmitFile(null);
      e.target.reset();
      setActionMessage('Submission uploaded successfully.');
    } catch (err) {
      setActionMessage(err.message || 'Upload failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartQuiz = (quizId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!enrolled) {
      setActionMessage('You must enroll in this course to take assessments.');
      return;
    }
    setActiveQuizForTaking(quizId);
  };

  const handleQuizCompleted = async (result) => {
    // Refresh quizzes list
    const qList = await quizService.getCourseQuizzes(id);
    setQuizzes(qList || []);

    if (result && result.attemptId) {
      setActiveAttemptForReview(result.attemptId);
    }
  };

  const sortedModules = [...(course?.modules || [])].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="text-ink-soft">{error || 'Course not found.'}</p>
          <Link to="/courses" className="mt-4 inline-block text-sm font-semibold text-primary">
            ← Back to course catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to course catalog
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-paper-alt px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate">
                {course.category?.name || 'General'}
              </span>
              <span className="rounded-full bg-primary-light px-3 py-1 font-mono text-[11px] text-primary-dark">
                {levelLabels[course.level]}
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-2 text-ink-soft">
              Taught by {course.instructor?.name || 'a Pathway instructor'}
            </p>

            <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-soft">
              {course.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-6 border-t border-line pt-6 text-sm text-slate">
              <span className="flex items-center gap-2">
                <Users size={16} />
                {course.enrolledCount} student{course.enrolledCount === 1 ? '' : 's'} enrolled
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 size={16} />
                {levelLabels[course.level]} level
              </span>
              <span className="flex items-center gap-2">
                <Award size={16} />
                {quizzes.length} Assessment{quizzes.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* SECTION 1: Learning Path */}
            {sortedModules.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ListOrdered size={20} className="text-primary" />
                  Learning path
                </h2>
                <ol className="mt-4 space-y-4">
                  {sortedModules.map((mod) => {
                    // Match any quizzes linked specifically to this module
                    const moduleQuizzes = quizzes.filter((q) => q.moduleOrder === mod.order);

                    return (
                      <li
                        key={`${mod.order}-${mod.title}`}
                        className="rounded-xl border border-line bg-paper-alt px-5 py-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wide text-primary">
                            Module {mod.order}
                          </p>
                          {moduleQuizzes.length > 0 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                              {moduleQuizzes.length} Quiz Linked
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-ink text-base">{mod.title}</p>
                        {mod.description && (
                          <p className="text-sm text-ink-soft leading-relaxed">{mod.description}</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* SECTION 2: Quizzes & Assessments */}
            {quizzes.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Award size={20} className="text-primary" />
                    Quizzes & Knowledge Checks ({quizzes.length})
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate">
                  Test your understanding with self-paced or timed evaluations.
                </p>

                <div className="mt-4 space-y-4">
                  {quizzes.map((quiz) => {
                    const attemptsMade = quiz.totalAttemptsMade || 0;
                    const maxAttempts = quiz.maxAttempts || 0;
                    const hasAttemptsLeft = maxAttempts === 0 || attemptsMade < maxAttempts;
                    const hasPassed = quiz.hasPassed;
                    const latestAttempt = quiz.latestAttempt;

                    return (
                      <div
                        key={quiz._id}
                        className="rounded-2xl border border-line bg-paper-alt p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {quiz.moduleOrder && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Module {quiz.moduleOrder}
                              </span>
                            )}
                            <span className="text-xs text-slate font-medium">
                              {quiz.questionCount} Questions · {quiz.totalPoints} Points
                            </span>
                            {quiz.timeLimit > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate font-medium">
                                <Clock size={12} /> {quiz.timeLimit} mins
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-base font-bold text-ink">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-xs text-slate line-clamp-2">{quiz.description}</p>
                          )}

                          {/* Student attempt status pill if enrolled */}
                          {enrolled && currentUser?.role === 'student' && (
                            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                              {attemptsMade > 0 ? (
                                <>
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${
                                      hasPassed
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    {hasPassed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                    {hasPassed ? 'Passed' : 'Completed'} (Best: {quiz.highestScore}%)
                                  </span>
                                  <span className="text-slate">
                                    Attempts: {attemptsMade} {maxAttempts > 0 ? `/ ${maxAttempts}` : ''}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate italic">Not attempted yet</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line w-full md:w-auto justify-end">
                          {enrolled && currentUser?.role === 'student' ? (
                            <>
                              {latestAttempt && (
                                <button
                                  type="button"
                                  onClick={() => setActiveAttemptForReview(latestAttempt._id)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-paper border border-line text-ink-soft hover:text-primary rounded-xl transition"
                                >
                                  <Eye size={14} />
                                  <span>View Review</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={!hasAttemptsLeft}
                                onClick={() => handleStartQuiz(quiz._id)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                                  hasAttemptsLeft
                                    ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {attemptsMade > 0 ? (
                                  <>
                                    <RotateCcw size={14} />
                                    <span>{hasAttemptsLeft ? 'Retake Quiz' : 'No Attempts Left'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={14} />
                                    <span>Take Quiz</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleEnroll}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-paper border border-line text-primary hover:bg-primary-light rounded-xl transition"
                            >
                              <span>Enroll to Attempt</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 3: Learning Materials */}
            {materials.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <FileText size={20} className="text-primary" />
                  Learning materials
                </h2>
                <ul className="mt-4 space-y-2">
                  {materials.map((file) => (
                    <li key={file._id}>
                      <a
                        href={`${UPLOADS_BASE_URL}${file.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {file.originalName}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* SECTION 4: Student File Submission */}
            {enrolled && currentUser?.role === 'student' && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Upload size={20} className="text-primary" />
                  Submit your work
                </h2>
                <form onSubmit={handleSubmitWork} className="mt-4 flex flex-col gap-3 max-w-md">
                  <input
                    type="text"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    placeholder="Assignment or project title"
                    required
                    className="rounded-xl border border-line px-4 py-2.5 text-sm"
                  />
                  <FilePicker
                    id="student-submission-file"
                    required
                    disabled={submitLoading}
                    selectedName={submitFile?.name}
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="rounded-full bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60 w-fit px-6"
                  >
                    {submitLoading ? 'Uploading…' : 'Upload submission'}
                  </button>
                </form>
                {mySubmissions.length > 0 && (
                  <ul className="mt-6 space-y-3 text-sm">
                    {mySubmissions.map((sub) => (
                      <li key={sub._id} className="rounded-lg border border-line bg-paper-alt px-4 py-3">
                        <p className="font-medium text-ink">{sub.title}</p>
                        <a
                          href={`${UPLOADS_BASE_URL}${sub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-primary hover:underline"
                        >
                          {sub.originalName}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Right Aside: Enrollment Card */}
          <aside className="h-fit rounded-2xl border border-line bg-paper-alt p-6 sticky top-24">
            <p className="font-display text-2xl font-semibold text-ink">
              {course.price > 0 ? `৳${course.price}` : 'Free'}
            </p>

            {enrolled ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal/10 px-4 py-3 text-sm font-semibold text-teal">
                  <CircleCheck size={18} />
                  You're enrolled
                </div>
                <button
                  onClick={handleUnenroll}
                  disabled={actionLoading}
                  className="mt-3 w-full rounded-full border border-line py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                >
                  {actionLoading ? 'Please wait...' : 'Unenroll'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={actionLoading}
                className="mt-4 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {actionLoading ? 'Enrolling...' : 'Enroll now'}
              </button>
            )}

            {actionMessage && (
              <p className="mt-3 text-center text-xs text-slate">{actionMessage}</p>
            )}

            {!currentUser && (
              <p className="mt-3 text-center text-xs text-slate">
                <Link to="/login" className="font-semibold text-primary">
                  Log in
                </Link>{' '}
                as a student to enroll.
              </p>
            )}
          </aside>
        </div>
      </main>

      <Footer />

      {/* STUDENT QUIZ PLAYER MODAL */}
      <QuizPlayerModal
        isOpen={Boolean(activeQuizForTaking)}
        onClose={() => setActiveQuizForTaking(null)}
        quizId={activeQuizForTaking}
        onQuizCompleted={handleQuizCompleted}
      />

      {/* STUDENT QUIZ ATTEMPT REVIEW MODAL */}
      <QuizResultModal
        isOpen={Boolean(activeAttemptForReview)}
        onClose={() => setActiveAttemptForReview(null)}
        attemptId={activeAttemptForReview}
        onRetake={() => {
          if (activeQuizForTaking) {
            setActiveQuizForTaking(activeQuizForTaking);
          }
        }}
      />
    </div>
  );
}
