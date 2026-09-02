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
  ClipboardList,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Play,
  CheckCircle,
  Heart,
  X,
  Megaphone
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import FilePicker from '../components/FilePicker.jsx'
import QuizPlayerModal from '../components/QuizPlayerModal.jsx'
import QuizResultModal from '../components/QuizResultModal.jsx'
import { courseService, enrollmentService, authService, courseFileService, quizService, assignmentService, announcementService, UPLOADS_BASE_URL } from '../services/api.js'

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

  const [enrolled, setEnrolled] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [materials, setMaterials] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitFile, setSubmitFile] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState({});
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState(null);
  const [assignmentSubmitFile, setAssignmentSubmitFile] = useState(null);
  const [assignmentSubmitText, setAssignmentSubmitText] = useState('');
  const [assignmentSubmitLoading, setAssignmentSubmitLoading] = useState(false);
  const [activeQuizForTaking, setActiveQuizForTaking] = useState(null);
  const [activeAttemptForReview, setActiveAttemptForReview] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await courseService.getCourseById(id)
        setCourse(data)

        try {
          const mats = await courseFileService.getMaterials(id)
          setMaterials(mats)
        } catch {
          setMaterials([])
        }

        try {
          const qList = await quizService.getCourseQuizzes(id);
          setQuizzes(qList || []);
        } catch { setQuizzes([]); }

        try {
          const aList = await assignmentService.getCourseAssignments(id);
          setAssignments(aList || []);
          if (currentUser?.role === 'student') {
            const subsMap = {};
            (aList || []).forEach(a => {
              if (a.mySubmission) {
                subsMap[a._id] = a.mySubmission;
              }
            });
            setAssignmentSubmissions(subsMap);
          }
        } catch { setAssignments([]); }

        try {
          const annList = await announcementService.getAnnouncements(id);
          setAnnouncements(annList || []);
        } catch { setAnnouncements([]); }

        if (currentUser) {
          try {
            const wishlist = await authService.getWishlist();
            setIsWishlisted(wishlist.some(c => c._id === id));
          } catch {}
        }

        // Only students who are logged in can have an enrollment status
        if (currentUser?.role === 'student') {
          const status = await enrollmentService.getEnrollmentStatus(id)
          setEnrolled(status.enrolled)
          setEnrollmentId(status.enrollmentId)
          if (status.enrolled) {
            const subs = await courseFileService.getMySubmissions(id)
            setMySubmissions(subs)
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load course')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!currentUser) return navigate('/login');
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await authService.removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await authService.addToWishlist(id);
        setIsWishlisted(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

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
      // Reload quizzes & assignments to get student attempt status
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
  }

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

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssignmentForSubmit) return;
    if (!assignmentSubmitFile && !assignmentSubmitText.trim()) {
      alert('Please upload a file or enter submission notes.');
      return;
    }
    setAssignmentSubmitLoading(true);
    try {
      const res = await assignmentService.submitAssignment(
        activeAssignmentForSubmit._id,
        assignmentSubmitFile,
        assignmentSubmitText.trim()
      );
      setAssignmentSubmissions((prev) => ({ ...prev, [activeAssignmentForSubmit._id]: res }));
      setActiveAssignmentForSubmit(null);
      setAssignmentSubmitFile(null);
      setAssignmentSubmitText('');
      setActionMessage('Assignment submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setAssignmentSubmitLoading(false);
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
                {quizzes.length} Quiz{quizzes.length === 1 ? '' : 'zes'}
              </span>
              <span className="flex items-center gap-2">
                <ClipboardList size={16} />
                {assignments.length} Assignment{assignments.length === 1 ? '' : 's'}
              </span>
            </div>

            {currentUser && (enrolled || currentUser.role === 'instructor' || currentUser.role === 'admin') && (
              <div className="mt-6">
                <Link
                  to={`/courses/${id}/forum`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-alt px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <MessageSquare size={16} />
                  Discussion forum
                </Link>
              </div>
            )}

            {/* SECTION 1: Learning Path */}
            {sortedModules.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ListOrdered size={20} className="text-primary" />
                  Learning path
                </h2>
                <ol className="mt-4 space-y-4">
                  {sortedModules.map((mod) => (
                    <li
                      key={`${mod.order}-${mod.title}`}
                      className="rounded-xl border border-line bg-paper-alt px-4 py-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        Module {mod.order}
                      </p>
                      <p className="mt-1 font-semibold text-ink">{mod.title}</p>
                      {mod.description && (
                        <p className="mt-1 text-sm text-ink-soft">{mod.description}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* SECTION 2: Quizzes & Knowledge Checks */}
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
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary-light text-primary border border-primary/20">
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
                                    className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full ${hasPassed
                                        ? 'bg-teal/10 text-teal'
                                        : 'bg-amber/10 text-amber-dark'
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
                                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition shadow-sm ${hasAttemptsLeft
                                    ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                                    : 'bg-slate/20 text-slate cursor-not-allowed'
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

            {/* SECTION 3: Course Assignments */}
            {assignments.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ClipboardList size={20} className="text-primary" />
                  Course Assignments ({assignments.length})
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Complete and submit assignments to get instructor feedback and marks.
                </p>

                <div className="mt-4 space-y-4">
                  {assignments.map((assign) => {
                    const mySub = assignmentSubmissions[assign._id];
                    const isSubmitted = Boolean(mySub);
                    const isGraded = mySub && mySub.marks !== undefined && mySub.marks !== null;

                    return (
                      <div
                        key={assign._id}
                        className="rounded-2xl border border-line bg-paper-alt p-5 flex flex-col gap-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-display text-base font-bold text-ink">{assign.title}</h3>
                              {isGraded ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                                  <CheckCircle size={12} /> Graded: {mySub.marks}/{assign.maxMarks}
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber/10 text-amber-dark border border-amber/20">
                                  <Clock size={12} /> Submitted (Awaiting Grade)
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate mt-1">
                              Max Marks: {assign.maxMarks} · Due:{' '}
                              {new Date(assign.deadline).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>

                        {assign.description && (
                          <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-line">
                            {assign.description}
                          </p>
                        )}

                        {assign.fileUrl && (
                          <div>
                            <a
                              href={`${UPLOADS_BASE_URL}${assign.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <FileText size={14} /> Download Instructions ({assign.originalName})
                            </a>
                          </div>
                        )}

                        {/* Submission status for enrolled students */}
                        {enrolled && currentUser?.role === 'student' && (
                          <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-slate">
                              {isSubmitted ? (
                                <span>
                                  Submitted on {new Date(mySub.submittedAt).toLocaleString()}
                                  {mySub.feedback && (
                                    <span className="block text-teal mt-0.5 font-medium">
                                      Instructor Feedback: {mySub.feedback}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-amber-dark font-medium">Not submitted yet</span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveAssignmentForSubmit(assign);
                                setAssignmentSubmitFile(null);
                                setAssignmentSubmitText(mySub?.submissionText || '');
                              }}
                              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors shrink-0"
                            >
                              {isSubmitted ? 'Resubmit Assignment' : 'Submit Assignment'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 4: Learning Materials */}
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

            {announcements.length > 0 && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Megaphone size={20} className="text-primary" />
                  Course Announcements
                </h2>
                <div className="mt-4 space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann._id} className="rounded-xl border border-line bg-paper-alt px-5 py-4">
                      <h3 className="font-bold text-ink">{ann.title}</h3>
                      <p className="text-xs text-slate mt-1">
                        Posted on {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="mt-3 text-sm text-ink-soft whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 5: Student File Submission (General) */}
            {enrolled && currentUser?.role === 'student' && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Upload size={20} className="text-primary" />
                  Submit general course work
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
                      <li key={sub._id} className="flex justify-between items-center rounded-lg border border-line bg-paper-alt px-4 py-3">
                        <div>
                          <p className="font-medium text-ink">{sub.title}</p>
                          <a
                            href={`${UPLOADS_BASE_URL}${sub.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-primary text-xs hover:underline"
                          >
                            {sub.originalName}
                          </a>
                        </div>
                        {sub.grade !== null && sub.grade !== undefined && (
                          <div className="bg-teal/10 text-teal px-3 py-1.5 rounded-lg text-sm font-bold">
                            Score: {sub.grade}/100
                          </div>
                        )}
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

            {currentUser?.role === 'student' && !enrolled && (
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
              >
                <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                {wishlistLoading ? 'Updating...' : isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
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

      {/* STUDENT ASSIGNMENT SUBMISSION MODAL */}
      {activeAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-paper-alt rounded-2xl shadow-xl border border-line overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Upload size={20} className="text-primary" />
                Submit Work for "{activeAssignmentForSubmit.title}"
              </h2>
              <button
                onClick={() => setActiveAssignmentForSubmit(null)}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1">
                  Upload Submission File (PDF, DOCX, Image)
                </label>
                <FilePicker
                  id="assignment-submission-file-picker"
                  selectedName={assignmentSubmitFile?.name}
                  onChange={(e) => setAssignmentSubmitFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                  Submission Notes / Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Include any notes or links for the instructor..."
                  value={assignmentSubmitText}
                  onChange={(e) => setAssignmentSubmitText(e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActiveAssignmentForSubmit(null)}
                  className="px-4 py-2 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignmentSubmitLoading}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {assignmentSubmitLoading && <Loader2 size={14} className="animate-spin" />}
                  Submit Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      <Footer />
    </div>
  );
}
