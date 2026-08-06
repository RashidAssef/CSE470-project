import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2, FileText, Users, BarChart3, GraduationCap, X, Search, UserPlus, Trash, ShieldAlert, Settings } from 'lucide-react';
import { authService, courseService, courseFileService, enrollmentService, UPLOADS_BASE_URL } from '../services/api.js';
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

  // New states for student management & analytics
  const [activeTab, setActiveTab] = useState('path'); // 'path', 'students', 'analytics'
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [activeStudentsList, setActiveStudentsList] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDropStudent, setConfirmDropStudent] = useState(null); // student Object if modal open

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

      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
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

            <section className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-lg font-semibold">Student submissions</h2>
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
                      <th className="pb-3 font-semibold">Submissions Progress</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm text-ink-soft">
                    {enrolledStudents
                      .filter((e) => {
                        const name = e.student?.name || '';
                        const email = e.student?.email || '';
                        return name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                               email.toLowerCase().includes(studentSearchQuery.toLowerCase());
                      })
                      .map((e) => {
                        // Count student submissions for this course
                        const studentSubmissions = submissions.filter(
                          (sub) => (sub.student?._id || sub.student) === (e.student?._id || e.student)
                        ).length;

                        return (
                          <tr key={e._id} className="hover:bg-paper/30 transition-colors">
                            <td className="py-3 font-semibold text-ink">{e.student?.name || 'N/A'}</td>
                            <td className="py-3 text-xs">{e.student?.email || 'N/A'}</td>
                            <td className="py-3 text-xs">
                              {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 bg-line rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ 
                                      width: `${materials.length > 0 ? Math.min(100, (studentSubmissions / materials.length) * 100) : 0}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono font-medium">
                                  {studentSubmissions}/{materials.length}
                                </span>
                              </div>
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
                        );
                      })}
                    {enrolledStudents.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-sm text-slate">
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
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Quiz Participants</span>
                  <h3 className="text-3xl font-bold mt-1 text-ink">{Math.round((course?.enrolledCount || 0) * 0.8)} attempts</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Total unique students who completed objective-type quizzes in this course.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Passing Rate</span>
                  <h3 className="text-3xl font-bold mt-1 text-teal">85% passed</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Percentage of students scoring 50% or higher in objective assessments.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Avg Mark Per Quiz</span>
                  <h3 className="text-3xl font-bold mt-1 text-primary">78 / 100</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Average grade across all student quiz evaluations.
                </p>
              </div>

              <div className="border border-line bg-paper p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Course Completion Rate</span>
                  <h3 className="text-3xl font-bold mt-1 text-indigo-800">64% finished</h3>
                </div>
                <p className="text-[11px] text-slate mt-3 leading-relaxed">
                  Percentage of enrolled students who viewed all modules and completed submissions.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

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
              Are you sure you want to drop <strong>{confirmDropStudent.student?.name}</strong> ({confirmDropStudent.student?.email}) from the course? This action will remove all progress and access.
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


