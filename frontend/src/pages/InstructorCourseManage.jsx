import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  FileText,
  Users,
  BarChart3,
  GraduationCap,
  X,
  Search,
  UserPlus,
  Trash,
  ShieldAlert,
  Settings,
  Award,
  Clock,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import {
  authService,
  courseService,
  courseFileService,
  enrollmentService,
  assignmentService,
  quizService,
  UPLOADS_BASE_URL,
} from '../services/api.js';
import FilePicker from '../components/FilePicker.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import QuizBuilderModal from '../components/QuizBuilderModal.jsx';
import QuizSubmissionsModal from '../components/QuizSubmissionsModal.jsx';
import QuizResultModal from '../components/QuizResultModal.jsx';

export default function InstructorCourseManage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingModules, setSavingModules] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialFile, setMaterialFile] = useState(null);

  // Tab & Student management states
  const [activeTab, setActiveTab] = useState('path'); // 'path', 'assignments', 'quizzes', 'students', 'analytics'
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [activeStudentsList, setActiveStudentsList] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDropStudent, setConfirmDropStudent] = useState(null);

  // Assignment Modal & Form states
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxMarks: 100,
    file: null,
  });
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [assignmentSubmissionsList, setAssignmentSubmissionsList] = useState([]);
  const [loadingAssignmentSubmissions, setLoadingAssignmentSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Quiz Modal States
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState(null);
  const [selectedQuizForSubmissions, setSelectedQuizForSubmissions] = useState(null);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
      setModules(
        (data.modules || []).map((m) => ({
          title: m.title,
          description: m.description || '',
          order: m.order,
        }))
      );
      const mats = await courseFileService.getMaterials(courseId);
      setMaterials(mats);
      const subs = await courseFileService.getCourseSubmissions(courseId);
      setSubmissions(subs);

      // Fetch Assignments
      try {
        const assignList = await assignmentService.getCourseAssignments(courseId);
        setAssignments(assignList || []);
      } catch {
        setAssignments([]);
      }

      // Fetch Quizzes
      try {
        const qList = await quizService.getCourseQuizzes(courseId);
        setQuizzes(qList || []);
      } catch {
        setQuizzes([]);
      }

      // Fetch enrolled students and active students lists
      const students = await enrollmentService.getCourseEnrollments(courseId);
      setEnrolledStudents(students || []);
      const allActive = await enrollmentService.getActiveStudents();
      setActiveStudentsList(allActive || []);
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'instructor') {
      navigate('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, navigate]);

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { title: '', description: '', order: prev.length + 1 },
    ]);
  };

  const updateModule = (index, field, value) => {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeModule = (index) => {
    setModules((prev) =>
      prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 }))
    );
  };

  const saveModules = async () => {
    setSavingModules(true);
    setMessage('');
    try {
      const saved = await courseService.updateCourseModules(courseId, modules);
      setModules(saved);
      setMessage('Learning path saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingModules(false);
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!materialFile) return;
    setUploading(true);
    setMessage('');
    try {
      await courseFileService.uploadMaterial(courseId, materialFile);
      setMaterialFile(null);
      e.target.reset();
      const mats = await courseFileService.getMaterials(courseId);
      setMaterials(mats);
      setMessage('Material uploaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Assignment Management Handlers
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignmentForm.title.trim() || !newAssignmentForm.deadline) return;
    setCreatingAssignment(true);
    setError('');
    setMessage('');
    try {
      await assignmentService.createAssignment(
        courseId,
        newAssignmentForm.title.trim(),
        newAssignmentForm.description.trim(),
        newAssignmentForm.deadline,
        Number(newAssignmentForm.maxMarks) || 100,
        newAssignmentForm.file
      );
      setNewAssignmentForm({
        title: '',
        description: '',
        deadline: '',
        maxMarks: 100,
        file: null,
      });
      setIsCreateAssignmentOpen(false);
      const list = await assignmentService.getCourseAssignments(courseId);
      setAssignments(list || []);
      setMessage('Assignment created successfully.');
    } catch (err) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await assignmentService.deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      setMessage('Assignment deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const handleOpenAssignmentSubmissions = async (assignment) => {
    setSelectedAssignmentForSubmissions(assignment);
    setLoadingAssignmentSubmissions(true);
    setGradingSubmissionId(null);
    try {
      const subs = await assignmentService.getAssignmentSubmissions(assignment._id);
      setAssignmentSubmissionsList(subs || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoadingAssignmentSubmissions(false);
    }
  };

  const handleStartGrading = (submission) => {
    setGradingSubmissionId(submission._id);
    setGradeForm({
      marks: submission.marks !== undefined && submission.marks !== null ? submission.marks : '',
      feedback: submission.feedback || '',
    });
  };

  const handleSaveGrade = async (submissionId) => {
    setSubmittingGrade(true);
    try {
      const updated = await assignmentService.gradeSubmission(
        submissionId,
        Number(gradeForm.marks),
        gradeForm.feedback.trim()
      );
      setAssignmentSubmissionsList((prev) =>
        prev.map((s) => (s._id === submissionId ? updated : s))
      );
      setGradingSubmissionId(null);
      setMessage('Grade saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save grade');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Student Enrollment Handlers
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentToEnroll) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await enrollmentService.enrollStudentInCourse(courseId, selectedStudentToEnroll);
      setSelectedStudentToEnroll('');
      const students = await enrollmentService.getCourseEnrollments(courseId);
      setEnrolledStudents(students || []);

      if (course) {
        setCourse({ ...course, enrolledCount: (course.enrolledCount || 0) + 1 });
      }

      setMessage('Student successfully enrolled.');
    } catch (err) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDropStudent = async () => {
    if (!confirmDropStudent) return;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const targetStudentId = confirmDropStudent.student?._id || confirmDropStudent.student;
      await enrollmentService.removeStudentFromCourse(courseId, targetStudentId);
      setConfirmDropStudent(null);
      const students = await enrollmentService.getCourseEnrollments(courseId);
      setEnrolledStudents(students || []);

      if (course) {
        setCourse({ ...course, enrolledCount: Math.max(0, (course.enrolledCount || 1) - 1) });
      }

      setMessage('Student successfully removed from course.');
    } catch (err) {
      setError(err.message || 'Failed to drop student');
    } finally {
      setActionLoading(false);
    }
  };

  // Quiz Management Handlers
  const handleTogglePublishQuiz = async (quizId) => {
    try {
      const updated = await quizService.togglePublishQuiz(quizId);
      setQuizzes((prev) =>
        prev.map((q) => (q._id === quizId ? { ...q, isPublished: updated.isPublished } : q))
      );
      setMessage(
        `Quiz status updated: ${updated.isPublished ? 'Published to Students' : 'Saved as Draft'}`
      );
    } catch (err) {
      setError(err.message || 'Failed to toggle quiz status');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz and all student attempts?')) return;
    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      setMessage('Quiz deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete quiz');
    }
  };

  const handleOpenCreateQuiz = () => {
    setSelectedQuizForEdit(null);
    setIsQuizBuilderOpen(true);
  };

  const handleOpenEditQuiz = (quiz) => {
    setSelectedQuizForEdit(quiz);
    setIsQuizBuilderOpen(true);
  };

  const handleOpenSubmissions = (quiz) => {
    setSelectedQuizForSubmissions(quiz);
  };

  const handleToggleCourseCompletion = async () => {
    const actionText = course?.isCompleted ? 'reopen this course as in-progress' : 'mark this entire course as completed';
    if (!window.confirm(`Are you sure you want to ${actionText}?${!course?.isCompleted ? ' Enrolled students who passed all quizzes will have their Certificate of Completion unlocked.' : ''}`)) {
      return;
    }
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const updated = await courseService.toggleCourseCompletion(courseId);
      setCourse(updated);
      setMessage(`Course successfully ${updated.isCompleted ? 'marked as completed! Certificates unlocked for qualifying students.' : 'reopened as in-progress.'}`);
    } catch (err) {
      setError(err.message || 'Failed to update course completion status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCompleteQuiz = async (quizId) => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const updated = await quizService.toggleCompleteQuiz(quizId);
      setQuizzes((prev) =>
        prev.map((q) => (q._id === quizId ? { ...q, isCompleted: updated.isCompleted } : q))
      );
      setMessage(`Quiz marked as ${updated.isCompleted ? 'completed' : 'active'}.`);
    } catch (err) {
      setError(err.message || 'Failed to update quiz status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-ink-soft">
        {error}
        <Link to="/instructor/dashboard" className="mt-4 block text-primary font-semibold">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-line bg-paper-alt px-6 md:px-12 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-paper-alt">
            <GraduationCap size={20} className="text-white" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Pathway Instructor<span className="text-primary">.</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link
            to="/instructor/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-paper/85 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-10">
        <Link
          to="/instructor/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Instructor dashboard
        </Link>

        <div className="mt-4 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-semibold">{course?.title}</h1>
              {course?.isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 text-teal px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle size={14} />
                  Course Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 text-amber-dark px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  <Clock size={14} />
                  In Progress
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Course Management Portal • {course?.isCompleted ? 'Finalized (Certificates unlocked)' : 'Active learning mode'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleCourseCompletion}
              disabled={actionLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition ${
                course?.isCompleted
                  ? 'bg-paper text-slate border border-line hover:text-ink'
                  : 'bg-teal text-white hover:bg-teal/90 shadow-teal/20'
              }`}
            >
              <Award size={16} />
              <span>{course?.isCompleted ? 'Reopen Course' : 'Mark Course Completed'}</span>
            </button>

            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-primary">
              {course?.enrolledCount || 0} enrolled student{(course?.enrolledCount || 0) === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal">{message}</p>}

        {/* Tab Headers */}
        <div className="mt-8 flex border-b border-line overflow-x-auto no-scrollbar gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('path')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'path'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <FileText size={16} />
            Learning Path & Files
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'assignments'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <ClipboardList size={16} />
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'quizzes'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <Award size={16} />
            Quizzes & Assessments ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <Users size={16} />
            Enrolled Students ({enrolledStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <BarChart3 size={16} />
            Analytics Dashboard
          </button>
        </div>

        {/* TAB 1: Learning Path & Materials */}
        {activeTab === 'path' && (
          <>
            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold">Sequential modules</h2>
              <p className="mt-1 text-sm text-slate">
                Students see these steps in order on the course page.
              </p>

              <div className="mt-4 flex flex-col gap-4">
                {modules.map((mod, index) => (
                  <div key={index} className="rounded-xl border border-line bg-paper p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary">Module {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeModule(index)}
                        className="text-slate hover:text-red-600"
                        aria-label="Remove module"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Module title"
                      value={mod.title}
                      onChange={(e) => updateModule(index, 'title', e.target.value)}
                      className="mt-2 w-full rounded-lg border border-line bg-paper-alt px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                    />
                    <textarea
                      placeholder="Optional description"
                      value={mod.description}
                      onChange={(e) => updateModule(index, 'description', e.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-line bg-paper-alt px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addModule}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-alt"
                >
                  <Plus size={16} /> Add module
                </button>
                <button
                  type="button"
                  onClick={saveModules}
                  disabled={savingModules}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingModules ? 'Saving…' : 'Save learning path'}
                </button>
              </div>
            </section>

            {/* Course materials upload */}
            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold">Course materials</h2>
              <p className="mt-1 text-sm text-slate">Upload lecture notes, PDFs, or assignments.</p>

              <form onSubmit={handleMaterialUpload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <FilePicker
                  onFileSelected={setMaterialFile}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg"
                  disabled={uploading}
                />
                <button
                  type="submit"
                  disabled={uploading || !materialFile}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading…' : 'Upload file'}
                </button>
              </form>

              <ul className="mt-4 divide-y divide-line">
                {materials.length === 0 ? (
                  <li className="py-2 text-sm text-slate">No files uploaded yet.</li>
                ) : (
                  materials.map((m) => (
                    <li key={m._id} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium text-ink">{m.originalName}</span>
                      <a
                        href={`${UPLOADS_BASE_URL}${m.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Download
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </section>

            {/* Student assignment submissions */}
            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold">Student file submissions</h2>
              <p className="mt-1 text-sm text-slate">Files submitted by enrolled students.</p>

              <ul className="mt-4 space-y-3">
                {submissions.length === 0 ? (
                  <li className="text-sm text-slate">No submissions yet.</li>
                ) : (
                  submissions.map((sub) => (
                    <li key={sub._id} className="rounded-lg border border-line bg-paper px-4 py-3 text-sm">
                      <p className="font-semibold">{sub.title}</p>
                      <p className="text-xs text-slate">
                        {sub.student?.name || 'Student'} · {new Date(sub.createdAt).toLocaleString()}
                      </p>
                      <a
                        href={`${UPLOADS_BASE_URL}${sub.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-primary font-medium hover:underline"
                      >
                        {sub.originalName}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}

        {/* TAB 2: Assignments */}
        {activeTab === 'assignments' && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-alt border border-line rounded-2xl p-6">
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <ClipboardList size={20} className="text-primary" /> Course Assignments
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Create and manage assignments, deadlines, and grade student submissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAssignmentOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition shrink-0"
              >
                <Plus size={16} /> Create Assignment
              </button>
            </div>

            {/* Assignment List */}
            {assignments.length === 0 ? (
              <div className="text-center py-16 bg-paper-alt border border-line rounded-2xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold mx-auto">
                  <ClipboardList size={24} />
                </div>
                <h3 className="font-display text-base font-bold">No assignments created yet</h3>
                <p className="text-xs text-slate max-w-sm mx-auto">
                  Add an assignment to evaluate student work and set deadlines.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assignments.map((assign) => (
                  <div
                    key={assign._id}
                    className="bg-paper-alt border border-line rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate font-medium">
                          Max Marks: <strong>{assign.maxMarks || 100}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate font-medium">
                          <Clock size={12} /> Due: {new Date(assign.deadline).toLocaleDateString()}{' '}
                          {new Date(assign.deadline).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-ink">{assign.title}</h3>
                      {assign.description && (
                        <p className="text-xs text-slate line-clamp-2">{assign.description}</p>
                      )}

                      {assign.fileUrl && (
                        <a
                          href={`${UPLOADS_BASE_URL}${assign.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-xs text-primary font-medium hover:underline pt-1"
                        >
                          📎 {assign.originalName || 'Attached Instructions/Template'}
                        </a>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignmentSubmissions(assign)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper border border-line text-ink-soft hover:bg-paper-alt transition"
                      >
                        <Users size={14} />
                        <span>Submissions</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(assign._id)}
                        className="p-1.5 rounded-xl text-slate hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Quizzes & Assessments */}
        {activeTab === 'quizzes' && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-paper-alt border border-line rounded-2xl p-6">
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Award size={20} className="text-primary" /> Assessments & Knowledge Checks
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Create interactive multiple-choice, true/false, and short-answer quizzes with auto-grading.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateQuiz}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition shrink-0"
              >
                <Plus size={16} /> Create New Quiz
              </button>
            </div>

            {/* Quiz List */}
            {quizzes.length === 0 ? (
              <div className="text-center py-16 bg-paper-alt border border-line rounded-2xl p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold mx-auto">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-display text-base font-bold">No quizzes created yet</h3>
                <p className="text-xs text-slate max-w-sm mx-auto">
                  Boost student engagement and test comprehension by creating your first course quiz.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateQuiz}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl"
                >
                  <Plus size={14} /> Create Assessment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {quizzes.map((quiz) => {
                  const isPublished = quiz.isPublished;
                  return (
                    <div
                      key={quiz._id}
                      className="bg-paper-alt border border-line rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/40 transition"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              isPublished
                                ? 'bg-teal/10 text-teal'
                                : 'bg-slate-100 text-slate'
                            }`}
                          >
                            {isPublished ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {isPublished ? 'Published' : 'Draft'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              quiz.isCompleted
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-amber/10 text-amber-dark'
                            }`}
                          >
                            {quiz.isCompleted ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {quiz.isCompleted ? 'Quiz Completed' : 'Quiz Active'}
                          </span>

                          {quiz.moduleOrder && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-light text-primary">
                              Module {quiz.moduleOrder}
                            </span>
                          )}

                          <span className="text-xs text-slate font-medium">
                            {quiz.questionCount || (quiz.questions || []).length} questions · {quiz.totalPoints || 0} pts
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold text-ink">{quiz.title}</h3>

                        {quiz.description && (
                          <p className="text-xs text-slate line-clamp-2 max-w-xl">{quiz.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate pt-1 font-medium">
                          <span>Passing Mark: <strong>{quiz.passingScore}%</strong></span>
                          <span>Time Limit: <strong>{quiz.timeLimit > 0 ? `${quiz.timeLimit} mins` : 'Untimed'}</strong></span>
                          <span>Max Attempts: <strong>{quiz.maxAttempts > 0 ? quiz.maxAttempts : 'Unlimited'}</strong></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center flex-wrap gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line w-full md:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleteQuiz(quiz._id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            quiz.isCompleted
                              ? 'border-line bg-paper text-slate hover:text-ink'
                              : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                          title={quiz.isCompleted ? 'Reopen Quiz as Active' : 'Mark Quiz as Completed'}
                        >
                          <CheckCircle size={13} />
                          <span>{quiz.isCompleted ? 'Reopen Quiz' : 'Mark Completed'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePublishQuiz(quiz._id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            isPublished
                              ? 'border-amber-200 bg-amber-50 text-amber-dark hover:bg-amber-100'
                              : 'border-teal/30 bg-teal/10 text-teal hover:bg-teal/20'
                          }`}
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenSubmissions(quiz)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper border border-line text-ink-soft hover:bg-paper-alt transition"
                        >
                          <Users size={14} />
                          <span>Results</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditQuiz(quiz)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper border border-line text-ink-soft hover:text-primary transition"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="p-1.5 rounded-xl text-slate hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Quiz"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: Enrolled Students */}
        {activeTab === 'students' && (
          <>
            {/* Enrollment form */}
            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <UserPlus size={20} className="text-primary" /> Enroll a Student
              </h2>
              <p className="mt-1 text-sm text-slate">Add an active student to this course manually.</p>

              <form onSubmit={handleEnrollStudent} className="mt-4 flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <select
                    value={selectedStudentToEnroll}
                    onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                    required
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="">Select student to enroll</option>
                    {activeStudentsList
                      .filter((s) => !enrolledStudents.some((e) => (e.student?._id || e.student) === s._id))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedStudentToEnroll}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 shrink-0"
                >
                  {actionLoading ? 'Enrolling…' : 'Enroll Student'}
                </button>
              </form>
            </section>

            {/* Enrolled Students Table */}
            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-lg font-semibold">Currently Enrolled</h2>
                  <p className="text-xs text-slate mt-0.5">Students who are currently enrolled in your course.</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search enrolled students…"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper pl-9 pr-4 py-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-paper text-slate text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Enrollment Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {enrolledStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate text-xs">
                          No students are currently enrolled in this course.
                        </td>
                      </tr>
                    ) : (
                      enrolledStudents
                        .filter((e) => {
                          const name = e.student?.name || '';
                          const email = e.student?.email || '';
                          const q = studentSearchQuery.toLowerCase();
                          return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
                        })
                        .map((enrol) => (
                          <tr key={enrol._id} className="hover:bg-paper/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-ink">{enrol.student?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate">{enrol.student?.email || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate">
                              {new Date(enrol.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
                                {enrol.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setConfirmDropStudent(enrol)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* TAB 5: Analytics */}
        {activeTab === 'analytics' && (
          <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" /> Performance & Engagement Metrics
            </h2>
            <p className="mt-1 text-sm text-slate">
              Comprehensive enrollment, assessment performance, and active student trends.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Total Enrollment Base</span>
                  <h3 className="text-3xl font-bold mt-1 text-ink">{course?.enrolledCount || enrolledStudents.length}</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Students who have confirmed active enrollment in this course.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Total Quizzes</span>
                  <h3 className="text-3xl font-bold mt-1 text-teal">{quizzes.length} Quizzes</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Active objective assessments available to enrolled students.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Assignments</span>
                  <h3 className="text-3xl font-bold mt-1 text-primary">{assignments.length} Assignments</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Graded projects and subjective assignments.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Course Modules</span>
                  <h3 className="text-3xl font-bold mt-1 text-ink-soft">{modules.length} Modules</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Configured learning path milestones.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* CREATE ASSIGNMENT MODAL */}
      {isCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-paper-alt rounded-2xl shadow-xl border border-line p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" /> Create New Assignment
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateAssignmentOpen(false)}
                className="text-slate hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate block mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Final Project Phase 1"
                  value={newAssignmentForm.title}
                  onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, title: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate block mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide details about what students need to complete..."
                  value={newAssignmentForm.description}
                  onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, description: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-sm text-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate block mb-1">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newAssignmentForm.deadline}
                    onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, deadline: e.target.value })}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate block mb-1">Max Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={newAssignmentForm.maxMarks}
                    onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, maxMarks: e.target.value })}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2 text-xs text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate block mb-1">
                  Attach Problem Sheet / Reference File (Optional)
                </label>
                <FilePicker onFileSelected={(file) => setNewAssignmentForm({ ...newAssignmentForm, file })} />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(false)}
                  className="px-4 py-2 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingAssignment && <Loader2 size={14} className="animate-spin" />}
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT SUBMISSIONS & GRADING MODAL */}
      {selectedAssignmentForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-paper-alt rounded-2xl shadow-xl border border-line p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {selectedAssignmentForSubmissions.title} — Submissions
                </h3>
                <p className="text-xs text-slate">
                  Max Marks: {selectedAssignmentForSubmissions.maxMarks} · Due:{' '}
                  {new Date(selectedAssignmentForSubmissions.deadline).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignmentForSubmissions(null)}
                className="text-slate hover:text-ink p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {loadingAssignmentSubmissions ? (
                <div className="py-12 flex justify-center text-primary">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : assignmentSubmissionsList.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate">No student submissions received yet.</p>
              ) : (
                <div className="space-y-3">
                  {assignmentSubmissionsList.map((sub) => {
                    const isEditingGrade = gradingSubmissionId === sub._id;
                    const isGraded = sub.marks !== undefined && sub.marks !== null;
                    return (
                      <div key={sub._id} className="p-4 rounded-xl border border-line bg-paper">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-ink">{sub.student?.name || 'Student'}</p>
                            <p className="text-xs text-slate">{sub.student?.email || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isGraded
                                  ? 'bg-teal/10 text-teal border border-teal/20'
                                  : 'bg-amber/10 text-amber-dark border border-amber/20'
                              }`}
                            >
                              {isGraded ? `Graded (${sub.marks}/${selectedAssignmentForSubmissions.maxMarks})` : 'Submitted'}
                            </span>
                            <span className="text-xs text-slate">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* File / Text link */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                          {sub.fileUrl && (
                            <a
                              href={`${UPLOADS_BASE_URL}${sub.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText size={14} /> Download Submitted File ({sub.originalName})
                            </a>
                          )}
                          {sub.submissionText && (
                            <div className="w-full text-xs text-ink-soft bg-paper-alt p-3 rounded-lg border border-line">
                              <strong>Student Notes:</strong> {sub.submissionText}
                            </div>
                          )}
                        </div>

                        {/* Existing Feedback */}
                        {isGraded && !isEditingGrade && (
                          <div className="mt-3 text-xs bg-teal/5 border border-teal/20 p-3 rounded-lg">
                            <p className="font-semibold text-teal">
                              Grade: {sub.marks} / {selectedAssignmentForSubmissions.maxMarks}
                            </p>
                            {sub.feedback && <p className="text-ink-soft mt-1">Feedback: {sub.feedback}</p>}
                          </div>
                        )}

                        {/* Grade Form */}
                        {isEditingGrade ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveGrade(sub._id);
                            }}
                            className="mt-4 pt-3 border-t border-line flex flex-col gap-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-slate block mb-1">
                                  Marks (0 - {selectedAssignmentForSubmissions.maxMarks})
                                </label>
                                <input
                                  type="number"
                                  required
                                  min={0}
                                  max={selectedAssignmentForSubmissions.maxMarks}
                                  value={gradeForm.marks}
                                  onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                                  className="w-full rounded-lg border border-line bg-paper-alt px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-slate block mb-1">
                                  Instructor Feedback (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Great effort! Clear structure."
                                  value={gradeForm.feedback}
                                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                  className="w-full rounded-lg border border-line bg-paper-alt px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setGradingSubmissionId(null)}
                                className="px-3 py-1 text-xs font-semibold text-slate hover:text-ink"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submittingGrade}
                                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-1"
                              >
                                {submittingGrade && <Loader2 size={12} className="animate-spin" />}
                                Save Grade
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleStartGrading(sub)}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <Award size={14} /> {isGraded ? 'Update Grade' : 'Grade Submission'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DROP CONFIRMATION MODAL */}
      {confirmDropStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-paper-alt rounded-2xl shadow-xl border border-line p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <span className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                <ShieldAlert size={20} />
              </span>
              <h3 className="font-display text-lg font-bold">Unenroll Student?</h3>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">
              Are you sure you want to drop <strong>{confirmDropStudent.student?.name}</strong> (
              {confirmDropStudent.student?.email}) from the course? This action will remove all progress and access.
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmDropStudent(null)}
                className="px-4 py-2 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDropStudent}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Drop Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ BUILDER MODAL */}
      <QuizBuilderModal
        isOpen={isQuizBuilderOpen}
        onClose={() => setIsQuizBuilderOpen(false)}
        courseId={courseId}
        modules={modules}
        existingQuiz={selectedQuizForEdit}
        onSaved={load}
      />

      {/* QUIZ SUBMISSIONS & ANALYTICS MODAL */}
      <QuizSubmissionsModal
        isOpen={Boolean(selectedQuizForSubmissions)}
        onClose={() => setSelectedQuizForSubmissions(null)}
        quiz={selectedQuizForSubmissions}
        onViewAttemptReview={(attemptId) => setReviewAttemptId(attemptId)}
      />

      {/* QUIZ ATTEMPT REVIEW MODAL */}
      <QuizResultModal
        isOpen={Boolean(reviewAttemptId)}
        onClose={() => setReviewAttemptId(null)}
        attemptId={reviewAttemptId}
      />
    </div>
  );
}
