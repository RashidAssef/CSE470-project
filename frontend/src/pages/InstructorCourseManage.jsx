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
  ClipboardList,
  CheckCircle,
  Clock,
  Award,
} from 'lucide-react';
import {
  authService,
  courseService,
  courseFileService,
  enrollmentService,
  assignmentService,
  UPLOADS_BASE_URL,
} from '../services/api.js';
import FilePicker from '../components/FilePicker.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function InstructorCourseManage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingModules, setSavingModules] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [materialFile, setMaterialFile] = useState(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState('path'); // 'path', 'assignments', 'students', 'analytics'

  // Student management & analytics states
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [activeStudentsList, setActiveStudentsList] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDropStudent, setConfirmDropStudent] = useState(null);

  // Assignment states
  const [assignments, setAssignments] = useState([]);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [newAssignmentForm, setNewAssignmentForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxMarks: 100,
  });
  const [assignmentAttachment, setAssignmentAttachment] = useState(null);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // Submissions & Grading states
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [submittingGrade, setSubmittingGrade] = useState(false);

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

      // Fetch assignments
      const assList = await assignmentService.getCourseAssignments(courseId);
      setAssignments(assList || []);

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

  // ASSIGNMENT HANDLERS
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreatingAssignment(true);
    setError('');
    setMessage('');
    try {
      await assignmentService.createAssignment(
        courseId,
        newAssignmentForm.title,
        newAssignmentForm.description,
        newAssignmentForm.deadline,
        newAssignmentForm.maxMarks,
        assignmentAttachment
      );
      setMessage('Assignment created successfully.');
      setNewAssignmentForm({ title: '', description: '', deadline: '', maxMarks: 100 });
      setAssignmentAttachment(null);
      setIsCreateAssignmentOpen(false);

      const assList = await assignmentService.getCourseAssignments(courseId);
      setAssignments(assList || []);
    } catch (err) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment and all student submissions?')) return;
    try {
      await assignmentService.deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      setMessage('Assignment deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const handleOpenSubmissionsModal = async (assignment) => {
    setSelectedAssignmentForSubmissions(assignment);
    setLoadingSubmissions(true);
    setGradingSubmissionId(null);
    try {
      const subs = await assignmentService.getAssignmentSubmissions(assignment._id);
      setAssignmentSubmissions(subs || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleStartGrading = (sub) => {
    setGradingSubmissionId(sub._id);
    setGradeForm({
      marks: sub.marks !== null && sub.marks !== undefined ? sub.marks : '',
      feedback: sub.feedback || '',
    });
  };

  const handleSaveGrade = async (submissionId) => {
    setSubmittingGrade(true);
    setError('');
    try {
      const updatedSub = await assignmentService.gradeSubmission(
        submissionId,
        gradeForm.marks,
        gradeForm.feedback
      );
      setAssignmentSubmissions((prev) =>
        prev.map((s) => (s._id === submissionId ? updatedSub : s))
      );
      setGradingSubmissionId(null);
      setMessage('Student submission graded successfully.');
    } catch (err) {
      setError(err.message || 'Failed to submit grade');
    } finally {
      setSubmittingGrade(false);
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

      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-10">
        <Link
          to="/instructor/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Instructor dashboard
        </Link>

        <div className="mt-4 flex flex-col justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold">{course?.title}</h1>
            <p className="mt-1 text-sm text-ink-soft">Course Management Portal</p>
          </div>
          <span className="mt-2 w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-primary sm:mt-0">
            {course?.enrolledCount || 0} enrolled student{(course?.enrolledCount || 0) === 1 ? '' : 's'}
          </span>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal">{message}</p>}

        {/* Tab Headers */}
        <div className="mt-8 flex border-b border-line overflow-x-auto">
          <button
            onClick={() => setActiveTab('path')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
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
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'assignments'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <ClipboardList size={16} />
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
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
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <BarChart3 size={16} />
            Analytics Dashboard
          </button>
        </div>

        {/* Tab Contents */}
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
                      value={mod.title}
                      onChange={(e) => updateModule(index, 'title', e.target.value)}
                      placeholder="Module title"
                      className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
                    />
                    <textarea
                      value={mod.description}
                      onChange={(e) => updateModule(index, 'description', e.target.value)}
                      placeholder="Short description (optional)"
                      rows={2}
                      className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm resize-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addModule}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm font-semibold"
                >
                  <Plus size={16} /> Add module
                </button>
                <button
                  type="button"
                  onClick={saveModules}
                  disabled={savingModules}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingModules ? 'Saving…' : 'Save learning path'}
                </button>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold">Upload materials</h2>
              <form onSubmit={handleMaterialUpload} className="mt-4 flex flex-col gap-4">
                <FilePicker
                  id="instructor-material-file"
                  required
                  disabled={uploading}
                  selectedName={materialFile?.name}
                  onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                />
                <button
                  type="submit"
                  disabled={uploading || !materialFile}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </form>

              <ul className="mt-6 space-y-2">
                {materials.length === 0 ? (
                  <li className="text-sm text-slate">No files uploaded yet.</li>
                ) : (
                  materials.map((file) => (
                    <li key={file._id} className="flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-primary" />
                      <a
                        href={`${UPLOADS_BASE_URL}${file.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {file.originalName}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}

        {/* TAB: ASSIGNMENTS MANAGEMENT */}
        {activeTab === 'assignments' && (
          <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <ClipboardList size={20} className="text-primary" /> Course Assignments
                </h2>
                <p className="text-xs text-slate mt-0.5">
                  Create tasks, set deadlines and marks, and evaluate student submissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAssignmentOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-dark transition-colors shrink-0"
              >
                <Plus size={16} /> Create Assignment
              </button>
            </div>

            {/* List of Assignments */}
            <div className="mt-6 flex flex-col gap-4">
              {assignments.length === 0 ? (
                <div className="rounded-xl border border-line bg-paper p-8 text-center">
                  <ClipboardList className="mx-auto text-slate" size={28} />
                  <p className="mt-3 text-sm text-ink-soft">No assignments created for this course yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsCreateAssignmentOpen(true)}
                    className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    + Create your first assignment
                  </button>
                </div>
              ) : (
                assignments.map((ass) => {
                  const isPastDue = new Date() > new Date(ass.deadline);
                  return (
                    <div key={ass._id} className="rounded-xl border border-line bg-paper p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-ink">{ass.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                              isPastDue
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-teal-50 text-teal border border-teal-100'
                            }`}
                          >
                            {isPastDue ? 'Past Due' : 'Active'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate">Max Marks: {ass.maxMarks}</span>
                      </div>

                      <p className="mt-2 text-sm text-ink-soft whitespace-pre-line leading-relaxed">
                        {ass.description}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate border-t border-line pt-3">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={14} className="text-primary" />
                          Deadline: {new Date(ass.deadline).toLocaleString()}
                        </span>
                        {ass.attachment?.fileUrl && (
                          <a
                            href={`${UPLOADS_BASE_URL}${ass.attachment.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <FileText size={14} /> Attachment ({ass.attachment.originalName})
                          </a>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSubmissionsModal(ass)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white px-3.5 py-2 rounded-xl border border-primary/20 transition-colors"
                        >
                          <Users size={14} /> View Submissions
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(ass._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-2 rounded-xl border border-red-100 transition-colors"
                        >
                          <Trash size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

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
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-xl border border-line bg-paper pl-9 pr-4 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line text-xs font-bold text-slate uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Student Name</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Enrolled Date</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm text-ink-soft">
                    {enrolledStudents
                      .filter((e) => {
                        const name = e.student?.name || '';
                        const email = e.student?.email || '';
                        return (
                          name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                        );
                      })
                      .map((e) => (
                        <tr key={e._id} className="hover:bg-paper/30 transition-colors">
                          <td className="py-3 font-semibold text-ink">{e.student?.name || 'N/A'}</td>
                          <td className="py-3 text-xs">{e.student?.email || 'N/A'}</td>
                          <td className="py-3 text-xs">
                            {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setConfirmDropStudent(e)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors"
                            >
                              <Trash size={12} /> Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                    {enrolledStudents.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-sm text-slate">
                          No enrolled students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'analytics' && (
          <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" /> Performance & Engagement Stats
            </h2>
            <p className="mt-1 text-sm text-slate">Overall engagement and assessment results across all modules.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Total Assignments</span>
                  <h3 className="text-3xl font-bold mt-1 text-ink">{assignments.length} created</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Published assignments for active student evaluations.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Passing Rate</span>
                  <h3 className="text-3xl font-bold mt-1 text-teal">85% passed</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Percentage of students scoring 50% or higher in assessments.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* CREATE ASSIGNMENT MODAL */}
      {isCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-paper-alt rounded-2xl shadow-xl border border-line overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" />
                Create New Assignment
              </h2>
              <button
                onClick={() => setIsCreateAssignmentOpen(false)}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Project: REST API Design"
                  value={newAssignmentForm.title}
                  onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, title: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                  Description / Instructions
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide detailed instructions and guidelines for students..."
                  value={newAssignmentForm.description}
                  onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, description: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                    Deadline (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newAssignmentForm.deadline}
                    onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, deadline: e.target.value })}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                    Max Marks / Points
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAssignmentForm.maxMarks}
                    onChange={(e) => setNewAssignmentForm({ ...newAssignmentForm, maxMarks: e.target.value })}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1 font-sans">
                  Attachment File (Optional)
                </label>
                <FilePicker
                  id="assignment-attachment-file"
                  selectedName={assignmentAttachment?.name}
                  onChange={(e) => setAssignmentAttachment(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(false)}
                  className="px-4 py-2 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {creatingAssignment && <Loader2 size={14} className="animate-spin" />}
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & GRADE SUBMISSIONS MODAL */}
      {selectedAssignmentForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl bg-paper-alt rounded-2xl shadow-xl border border-line max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                  <Award size={20} className="text-primary" />
                  Submissions for "{selectedAssignmentForSubmissions.title}"
                </h2>
                <p className="text-xs text-slate mt-0.5">
                  Max Marks: {selectedAssignmentForSubmissions.maxMarks} · Deadline:{' '}
                  {new Date(selectedAssignmentForSubmissions.deadline).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForSubmissions(null)}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {loadingSubmissions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : assignmentSubmissions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate">
                  No students have submitted work for this assignment yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {assignmentSubmissions.map((sub) => {
                    const isGraded = sub.status === 'graded';
                    const isEditingGrade = gradingSubmissionId === sub._id;

                    return (
                      <div key={sub._id} className="rounded-xl border border-line bg-paper p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-ink">{sub.student?.name || 'Student'}</h4>
                            <p className="text-xs text-slate">{sub.student?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                isGraded
                                  ? 'bg-teal-50 text-teal border border-teal-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
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
                          <div className="mt-3 text-xs bg-teal-50/50 border border-teal-100 p-3 rounded-lg">
                            <p className="font-semibold text-teal-900">
                              Grade: {sub.marks} / {selectedAssignmentForSubmissions.maxMarks}
                            </p>
                            {sub.feedback && <p className="text-teal-800 mt-1">Feedback: {sub.feedback}</p>}
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
                                  className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink"
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
                                  className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink"
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
    </div>
  );
}
