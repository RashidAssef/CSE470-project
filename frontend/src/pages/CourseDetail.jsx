import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  BarChart3,
  CircleCheck,
  Loader2,
  ListOrdered,
  FileText,
  Upload,
  ClipboardList,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import FilePicker from '../components/FilePicker.jsx'
import {
  courseService,
  enrollmentService,
  authService,
  courseFileService,
  assignmentService,
  UPLOADS_BASE_URL,
} from '../services/api.js'

const levelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [enrolled, setEnrolled] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [materials, setMaterials] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitFile, setSubmitFile] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Course Assignments State
  const [courseAssignments, setCourseAssignments] = useState([])
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState(null)
  const [assignmentSubmitFile, setAssignmentSubmitFile] = useState(null)
  const [assignmentSubmitText, setAssignmentSubmitText] = useState('')
  const [assignmentSubmitLoading, setAssignmentSubmitLoading] = useState(false)

  const fetchCourseData = async () => {
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

      // Only students who are logged in can have an enrollment status
      if (currentUser?.role === 'student') {
        const status = await enrollmentService.getEnrollmentStatus(id)
        setEnrolled(status.enrolled)
        setEnrollmentId(status.enrollmentId)
        if (status.enrolled) {
          const subs = await courseFileService.getMySubmissions(id)
          setMySubmissions(subs)

          // Fetch Course Assignments for student
          try {
            const assList = await assignmentService.getCourseAssignments(id)
            setCourseAssignments(assList || [])
          } catch {
            setCourseAssignments([])
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourseData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleEnroll = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    if (currentUser.role !== 'student') {
      setActionMessage('Only student accounts can enroll in courses.')
      return
    }

    setActionLoading(true)
    setActionMessage('')
    try {
      const res = await enrollmentService.enroll(id)
      setEnrolled(true)
      setEnrollmentId(res.data._id)
      setCourse((prev) => ({ ...prev, enrolledCount: prev.enrolledCount + 1 }))
      setActionMessage(res.message)

      // Fetch assignments after enrolling
      try {
        const assList = await assignmentService.getCourseAssignments(id)
        setCourseAssignments(assList || [])
      } catch {
        setCourseAssignments([])
      }
    } catch (err) {
      setActionMessage(err.message || 'Could not enroll in this course')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnenroll = async () => {
    setActionLoading(true)
    setActionMessage('')
    try {
      await enrollmentService.unenroll(enrollmentId)
      setEnrolled(false)
      setEnrollmentId(null)
      setCourse((prev) => ({ ...prev, enrolledCount: Math.max(0, prev.enrolledCount - 1) }))
      setCourseAssignments([])
      setActionMessage('You have unenrolled from this course.')
    } catch (err) {
      setActionMessage(err.message || 'Could not unenroll from this course')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitWork = async (e) => {
    e.preventDefault()
    if (!submitFile || !submitTitle.trim()) return
    setSubmitLoading(true)
    setActionMessage('')
    try {
      await courseFileService.uploadSubmission(id, submitFile, submitTitle.trim())
      const subs = await courseFileService.getMySubmissions(id)
      setMySubmissions(subs)
      setSubmitTitle('')
      setSubmitFile(null)
      e.target.reset()
      setActionMessage('Submission uploaded successfully.')
    } catch (err) {
      setActionMessage(err.message || 'Upload failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault()
    if (!activeAssignmentForSubmit) return
    if (!assignmentSubmitFile && !assignmentSubmitText.trim()) {
      setActionMessage('Please attach a file or enter submission notes.')
      return
    }

    setAssignmentSubmitLoading(true)
    setActionMessage('')
    try {
      await assignmentService.submitAssignment(
        activeAssignmentForSubmit._id,
        assignmentSubmitFile,
        assignmentSubmitText.trim()
      )
      setActionMessage(`Assignment "${activeAssignmentForSubmit.title}" submitted successfully!`)
      setActiveAssignmentForSubmit(null)
      setAssignmentSubmitFile(null)
      setAssignmentSubmitText('')

      // Refresh assignments list
      const assList = await assignmentService.getCourseAssignments(id)
      setCourseAssignments(assList || [])
    } catch (err) {
      setActionMessage(err.message || 'Assignment submission failed')
    } finally {
      setAssignmentSubmitLoading(false)
    }
  }

  const sortedModules = [...(course?.modules || [])].sort((a, b) => a.order - b.order)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
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
    )
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
            </div>

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

            {/* DEDICATED COURSE ASSIGNMENTS SECTION */}
            {enrolled && currentUser?.role === 'student' && (
              <section className="mt-10 border-t border-line pt-8">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ClipboardList size={20} className="text-primary" />
                  Course Assignments
                </h2>
                <p className="mt-1 text-xs text-slate">
                  Complete required assignments before the deadline to earn marks and feedback.
                </p>

                <div className="mt-6 space-y-4">
                  {courseAssignments.length === 0 ? (
                    <p className="text-sm text-slate">No assignments posted for this course yet.</p>
                  ) : (
                    courseAssignments.map((ass) => {
                      const isPastDue = new Date() > new Date(ass.deadline)
                      const mySub = ass.mySubmission
                      const isGraded = mySub?.status === 'graded'
                      const isSubmitted = Boolean(mySub)

                      return (
                        <div
                          key={ass._id}
                          className="rounded-2xl border border-line bg-paper-alt p-5 shadow-xs transition-all hover:border-primary/30"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-base font-bold text-ink">{ass.title}</h3>
                              {isGraded ? (
                                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-teal border border-teal-100 flex items-center gap-1">
                                  <Award size={12} /> Graded ({mySub.marks}/{ass.maxMarks})
                                </span>
                              ) : isSubmitted ? (
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100 flex items-center gap-1">
                                  <CheckCircle size={12} /> Submitted
                                </span>
                              ) : isPastDue ? (
                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100 flex items-center gap-1">
                                  <AlertCircle size={12} /> Deadline Passed
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100 flex items-center gap-1">
                                  <Clock size={12} /> Open
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate">Max Marks: {ass.maxMarks}</span>
                          </div>

                          <p className="mt-2 text-sm text-ink-soft whitespace-pre-line leading-relaxed">
                            {ass.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate border-t border-line pt-3">
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="text-primary" /> Due:{' '}
                              {new Date(ass.deadline).toLocaleString()}
                            </span>
                            {ass.attachment?.fileUrl && (
                              <a
                                href={`${UPLOADS_BASE_URL}${ass.attachment.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText size={14} /> Download Instructor Reference ({ass.attachment.originalName})
                              </a>
                            )}
                          </div>

                          {/* Student Submission Status Card */}
                          {mySub && (
                            <div className="mt-4 rounded-xl border border-line bg-paper p-4 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-ink">Your Submission</span>
                                <span className="text-slate">Submitted: {new Date(mySub.submittedAt).toLocaleString()}</span>
                              </div>

                              {mySub.fileUrl && (
                                <a
                                  href={`${UPLOADS_BASE_URL}${mySub.fileUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                >
                                  <FileText size={14} /> {mySub.originalName || 'View Submitted File'}
                                </a>
                              )}

                              {mySub.submissionText && (
                                <p className="mt-2 text-slate bg-paper-alt p-2.5 rounded-lg border border-line">
                                  {mySub.submissionText}
                                </p>
                              )}

                              {isGraded && (
                                <div className="mt-3 bg-teal-50 border border-teal-100 p-3 rounded-lg text-teal-900">
                                  <p className="font-bold text-sm">
                                    Grade: {mySub.marks} / {ass.maxMarks}
                                  </p>
                                  {mySub.feedback && (
                                    <p className="mt-1 text-xs text-teal-800">
                                      <strong>Instructor Feedback:</strong> {mySub.feedback}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Submission Action Button */}
                          {!isGraded && !isPastDue && (
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAssignmentForSubmit(ass)
                                  setAssignmentSubmitFile(null)
                                  setAssignmentSubmitText(mySub?.submissionText || '')
                                }}
                                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                              >
                                {isSubmitted ? 'Resubmit Assignment Work' : 'Submit Assignment Work'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            )}

            {/* GENERIC WORK SUBMISSION SECTION (Preserved) */}
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

          {/* Enrollment card */}
          <aside className="h-fit rounded-2xl border border-line bg-paper-alt p-6">
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

      <Footer />
    </div>
  )
}
