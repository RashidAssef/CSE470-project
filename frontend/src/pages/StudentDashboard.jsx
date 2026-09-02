import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LogOut,
  GraduationCap,
  BookOpen,
  Compass,
  Loader2,
  Bell,
  Settings,
  Award,
  Bookmark,
  Trash,
  ShieldCheck,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  X,
  ClipboardList,
  Clock,
  Download,
} from 'lucide-react'
import { authService, enrollmentService, assignmentService, certificateService, UPLOADS_BASE_URL } from '../services/api.js'
import NotificationBell from '../components/NotificationBell.jsx'
import CertificateModal from '../components/CertificateModal.jsx'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [assignments, setAssignments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [activeCertForModal, setActiveCertForModal] = useState(null)
  const [certDownloadingId, setCertDownloadingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('courses') // 'courses', 'assignments', 'wishlist', 'certificates', 'announcements'

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    occupation: '',
    password: '',
  })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Load student dashboard data
  const loadDashboardData = async () => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)

    try {
      const enrolList = await enrollmentService.getMyEnrollments()
      setEnrollments(enrolList || [])

      const wishList = await authService.getWishlist()
      setWishlist(wishList || [])

      const assList = await assignmentService.getMyAssignmentsOverview()
      setAssignments(assList || [])

      try {
        const certList = await certificateService.getMyCertificates()
        setCertificates(certList || [])
      } catch {
        setCertificates([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course?')) return
    try {
      await enrollmentService.unenroll(enrollmentId)
      setEnrollments((prev) => prev.filter((e) => e._id !== enrollmentId))
    } catch (err) {
      setError(err.message || 'Could not unenroll from this course')
    }
  }

  const handleRemoveFromWishlist = async (courseId) => {
    try {
      await authService.removeFromWishlist(courseId)
      setWishlist((prev) => prev.filter((c) => c._id !== courseId))
    } catch (err) {
      setError(err.message || 'Could not remove course from wishlist')
    }
  }

  const handleOpenProfileModal = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      occupation: user?.occupation || '',
      password: '',
    })
    setProfileError('')
    setProfileSuccess('')
    setIsProfileModalOpen(true)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        occupation: profileForm.occupation,
      }
      if (profileForm.password.trim()) {
        updateData.password = profileForm.password
      }

      const updatedUser = await authService.updateProfile(updateData)
      setUser(updatedUser)
      setProfileSuccess('Profile updated successfully.')
      setTimeout(() => {
        setIsProfileModalOpen(false)
      }, 1500)
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleDownloadCertificate = async (courseId, courseTitle) => {
    if (!courseId) return;
    setCertDownloadingId(courseId);
    try {
      await certificateService.downloadCertificatePDF(courseId, courseTitle || 'Course');
    } catch (err) {
      alert(err.message || 'Failed to download certificate PDF');
    } finally {
      setCertDownloadingId(null);
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  // Filter completed enrollments for Certificates Tab
  const completedEnrollments = enrollments.filter(
    (e) => e.progress === 100 || e.status === 'completed'
  )

  return (
    <div className="min-h-screen bg-paper font-body text-ink flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-line bg-paper-alt h-16 flex items-center sticky top-0 z-10">
        <div className="mx-auto w-full max-w-5xl flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap size={20} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                Welcome back, {user?.name || 'Student'}
              </p>
              <p className="text-xs text-slate">Student dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Settings Icon */}
            <button
              onClick={handleOpenProfileModal}
              title="Profile Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-primary"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-red-300 hover:text-red-600"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-5xl w-full px-6 py-10 lg:px-8 flex-grow">
        {/* Banner header section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              My Workspace
            </h1>
            <p className="mt-1 text-sm text-slate">
              Track course progress, view assignments, download digital certificates, and manage bookmarks.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark shrink-0"
          >
            <Compass size={16} />
            Browse courses
          </Link>
        </div>

        {/* Tab Headers */}
        <div className="mt-8 flex border-b border-line overflow-x-auto">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'courses'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <BookOpen size={16} />
            My Courses ({enrollments.length})
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
            My Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'wishlist'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <Bookmark size={16} />
            My Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'certificates'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <Award size={16} />
            Certificates ({certificates.length > 0 ? certificates.length : completedEnrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === 'announcements'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate hover:text-ink'
            }`}
          >
            <FileText size={16} />
            Announcements
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="mt-8">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {!loading && error && (
            <p className="rounded-2xl border border-line bg-paper-alt p-6 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {/* TAB 1: Enrolled Courses */}
          {!loading && !error && activeTab === 'courses' && (
            <>
              {enrollments.length === 0 ? (
                <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
                  <BookOpen className="mx-auto text-slate" size={32} />
                  <p className="mt-4 text-sm text-ink-soft">
                    You haven't enrolled in any courses yet.
                  </p>
                  <Link
                    to="/courses"
                    className="mt-4 inline-block text-sm font-semibold text-primary"
                  >
                    Browse the course catalog →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {enrollments.map((enrollment) => {
                    const isCompleted = enrollment.progress === 100 || enrollment.status === 'completed'
                    return (
                      <div
                        key={enrollment._id}
                        className="flex flex-col rounded-2xl border border-line bg-paper-alt p-6 justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="w-fit rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate border border-line">
                              {enrollment.course?.category?.name || 'General'}
                            </span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-teal">
                                <ShieldCheck size={12} /> Complete
                              </span>
                            )}
                          </div>
                          <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                            {enrollment.course?.title || 'Course unavailable'}
                          </h3>
                          <p className="mt-1 text-sm text-slate">
                            {enrollment.course?.instructor?.name || 'Pathway Instructor'}
                          </p>

                          {/* Visual Progress bar */}
                          <div className="mt-6">
                            <div className="flex justify-between text-xs font-semibold mb-1 text-slate">
                              <span>Course Progress</span>
                              <span>{enrollment.progress || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-line">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-line">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/courses/${enrollment.course?._id}`}
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              Go to course →
                            </Link>
                            <button
                              onClick={() => handleUnenroll(enrollment._id)}
                              className="text-xs font-medium text-slate hover:text-red-600 transition-colors"
                            >
                              Unenroll
                            </button>
                          </div>

                          {/* Certificate download trigger */}
                          {isCompleted && (
                            <button
                              onClick={() => handleDownloadCertificate(enrollment.course?._id, enrollment.course?.title)}
                              disabled={certDownloadingId === enrollment.course?._id}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal/10 border border-teal/20 text-teal py-2.5 text-xs font-bold hover:bg-teal hover:text-white transition-colors mt-2 disabled:opacity-60"
                            >
                              {certDownloadingId === enrollment.course?._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Award size={14} />
                              )}
                              <span>
                                {certDownloadingId === enrollment.course?._id
                                  ? 'Downloading PDF...'
                                  : 'Download Certificate (PDF)'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: Assignments */}
          {!loading && !error && activeTab === 'assignments' && (
            <>
              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
                  <ClipboardList className="mx-auto text-slate" size={32} />
                  <p className="mt-4 text-sm text-ink-soft">
                    No active assignments found for your enrolled courses.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {assignments.map((ass) => {
                    const isPastDue = new Date() > new Date(ass.deadline)
                    const mySub = ass.mySubmission
                    const isGraded = mySub?.status === 'graded'
                    const isSubmitted = Boolean(mySub)

                    return (
                      <div
                        key={ass._id}
                        className="flex flex-col rounded-2xl border border-line bg-paper-alt p-6 justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="w-fit rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate border border-line">
                              {ass.course?.title || 'Enrolled Course'}
                            </span>
                            {isGraded ? (
                              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-teal bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 uppercase">
                                <Award size={12} /> Graded ({mySub.marks}/{ass.maxMarks})
                              </span>
                            ) : isSubmitted ? (
                              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                <CheckCircle size={12} /> Submitted
                              </span>
                            ) : isPastDue ? (
                              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase">
                                <AlertCircle size={12} /> Past Due
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                                <Clock size={12} /> Open
                              </span>
                            )}
                          </div>

                          <h3 className="mt-4 font-display text-lg font-semibold text-ink line-clamp-1">
                            {ass.title}
                          </h3>
                          <p className="mt-2 text-xs text-slate">
                            Max Marks: {ass.maxMarks} · Due: {new Date(ass.deadline).toLocaleString()}
                          </p>
                          <p className="mt-3 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                            {ass.description}
                          </p>

                          {isGraded && (
                            <div className="mt-3 bg-teal-50 border border-teal-100 p-3 rounded-xl text-xs text-teal-900">
                              <p className="font-bold">
                                Grade: {mySub.marks} / {ass.maxMarks}
                              </p>
                              {mySub.feedback && (
                                <p className="mt-1 text-[11px] text-teal-800">
                                  Feedback: {mySub.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 border-t border-line pt-4 flex items-center justify-between">
                          <Link
                            to={`/courses/${ass.course?._id || ass.course}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View course assignment →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 3: Bookmarks/Wishlist */}
          {!loading && !error && activeTab === 'wishlist' && (
            <>
              {wishlist.length === 0 ? (
                <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
                  <Bookmark className="mx-auto text-slate" size={32} />
                  <p className="mt-4 text-sm text-ink-soft">
                    You haven't bookmarked any courses yet.
                  </p>
                  <Link
                    to="/courses"
                    className="mt-4 inline-block text-sm font-semibold text-primary"
                  >
                    Browse courses to add →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {wishlist.map((course) => (
                    <div
                      key={course._id}
                      className="flex flex-col rounded-2xl border border-line bg-paper-alt p-6 justify-between"
                    >
                      <div>
                        <span className="w-fit rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate border border-line">
                          {course.category?.name || 'General'}
                        </span>
                        <h3 className="mt-4 font-display text-lg font-semibold text-ink line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate">
                          {course.instructor?.name || 'Pathway Instructor'}
                        </p>
                        <p className="mt-3 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                        <Link
                          to={`/courses/${course._id}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          View course details →
                        </Link>
                        <button
                          onClick={() => handleRemoveFromWishlist(course._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-2 py-1 rounded-lg border border-red-100 transition-colors"
                        >
                          <Trash size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 4: Certificates */}
          {!loading && !error && activeTab === 'certificates' && (
            <>
              {certificates.length === 0 && completedEnrollments.length === 0 ? (
                <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
                  <Award className="mx-auto text-slate" size={32} />
                  <h3 className="mt-4 font-display text-base font-bold text-ink">
                    No Certificates Earned Yet
                  </h3>
                  <p className="mt-1 text-xs text-slate max-w-sm mx-auto">
                    Take and pass all required quizzes in any of your enrolled courses to earn and download your official digital certificate.
                  </p>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="mt-4 inline-block text-xs font-bold text-primary hover:underline"
                  >
                    View enrolled courses →
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {(certificates.length > 0 ? certificates : completedEnrollments).map((item) => {
                    const isCertDoc = Boolean(item.certificateId);
                    const course = item.course;
                    const courseId = course?._id || course;
                    const courseTitle = course?.title || 'Course Certificate';
                    const categoryName = course?.category?.name || 'General';
                    const instructorName = item.instructorName || course?.instructor?.name || 'Lead Instructor';
                    const issueDate = item.issueDate || item.updatedAt;
                    const certificateId = item.certificateId;
                    const averageScore = item.averageScore;
                    const quizzesCount = item.quizzesCount;

                    return (
                      <div
                        key={item._id}
                        className="flex flex-col rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white via-paper-alt to-amber-50/40 p-6 justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="w-fit rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate border border-line">
                              {categoryName}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px] font-extrabold text-teal bg-teal/10 px-2 py-0.5 rounded-full border border-teal/20">
                              <ShieldCheck size={12} /> VERIFIED
                            </span>
                          </div>
                          <h3 className="mt-4 font-display text-lg font-bold text-ink line-clamp-1">
                            {courseTitle}
                          </h3>
                          <p className="mt-1 text-xs text-slate">
                            Instructor: <span className="font-semibold text-ink-soft">{instructorName}</span>
                          </p>

                          {averageScore !== undefined && (
                            <p className="mt-2 text-xs font-semibold text-teal">
                              Quiz Grade Average: {averageScore}% {quizzesCount ? `(${quizzesCount} quizzes passed)` : ''}
                            </p>
                          )}

                          <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-slate">
                            <span>
                              Issued: {issueDate ? new Date(issueDate).toLocaleDateString() : new Date().toLocaleDateString()}
                            </span>
                            {certificateId && (
                              <span className="font-mono text-[10px] text-ink-soft">
                                {certificateId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 border-t border-line pt-4 flex flex-col sm:flex-row gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadCertificate(courseId, courseTitle)}
                            disabled={certDownloadingId === courseId}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal text-white py-2.5 text-xs font-bold hover:bg-teal/90 transition-colors shadow-sm disabled:opacity-60"
                          >
                            {certDownloadingId === courseId ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            <span>{certDownloadingId === courseId ? 'Downloading...' : 'Download PDF'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCertForModal({
                                courseId,
                                courseTitle,
                                studentName: user?.name,
                                instructorName,
                                certificateId,
                                issueDate,
                                averageScore,
                                quizzesCount,
                              })
                            }
                            className="px-3.5 py-2.5 border border-line text-xs font-bold rounded-xl text-ink hover:bg-paper transition-colors flex items-center justify-center"
                          >
                            Preview
                          </button>
                          <Link
                            to={`/courses/${courseId}`}
                            className="px-3.5 py-2.5 border border-line text-xs font-semibold rounded-xl text-slate hover:text-ink hover:bg-paper transition-colors flex items-center justify-center"
                          >
                            Course
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 5: Announcements */}
          {!loading && !error && activeTab === 'announcements' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-line bg-paper-alt p-6 flex gap-4 items-start">
                <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Interactive Learning Platform Launch Day
                  </h3>
                  <p className="text-xs text-slate mt-0.5">Posted by Admin · August 6, 2026</p>
                  <p className="text-sm text-ink-soft mt-3 leading-relaxed">
                    Welcome to the launch of our brand new platform! We've made massive updates to visual designs, navigation tabs, performance, and course completion rates. Get started by browsing your curriculum today.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-paper-alt p-6 flex gap-4 items-start">
                <span className="h-10 w-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center shrink-0">
                  <Award size={20} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Earn Digital Certificates on 100% Progress
                  </h3>
                  <p className="text-xs text-slate mt-0.5">Posted by System · August 5, 2026</p>
                  <p className="text-sm text-ink-soft mt-3 leading-relaxed">
                    Digital certificate generation is now fully live! Complete all sequential modules, upload your task files/submissions, and download a verifiable certification from your enrolled courses tab instantly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* STUDENT PROFILE SETTINGS MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-paper-alt rounded-2xl shadow-xl border border-line flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <User size={20} className="text-primary" />
                Profile Settings
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleProfileUpdate} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {profileError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
                  <AlertCircle size={16} /> {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-teal-50 text-teal border border-teal-100 flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-teal" /> {profileSuccess}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5 font-sans">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5 font-sans">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5 font-sans">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +8801700000000"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5 font-sans">
                  Occupation / Study Bio
                </label>
                <input
                  type="text"
                  placeholder="e.g. Undergraduate Student, Research Fellow"
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5 font-sans">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2.5 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center gap-1.5"
                >
                  {profileLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFIED CERTIFICATE MODAL */}
      <CertificateModal
        isOpen={Boolean(activeCertForModal)}
        onClose={() => setActiveCertForModal(null)}
        courseId={activeCertForModal?.courseId}
        courseTitle={activeCertForModal?.courseTitle}
        studentName={activeCertForModal?.studentName}
        instructorName={activeCertForModal?.instructorName}
        certificateId={activeCertForModal?.certificateId}
        issueDate={activeCertForModal?.issueDate}
        averageScore={activeCertForModal?.averageScore}
        quizzesCount={activeCertForModal?.quizzesCount}
      />
    </div>
  )
}
