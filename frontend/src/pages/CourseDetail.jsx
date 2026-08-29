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
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import FilePicker from '../components/FilePicker.jsx'
import { courseService, enrollmentService, authService, courseFileService, announcementService, videoLectureService, UPLOADS_BASE_URL } from '../services/api.js'
import { Megaphone, PlayCircle, Heart } from 'lucide-react'

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
  const [announcements, setAnnouncements] = useState([])
  const [lectures, setLectures] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitFile, setSubmitFile] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

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
          const anns = await announcementService.getAnnouncements(id)
          setAnnouncements(anns)
        } catch {
          setAnnouncements([])
        }

        try {
          const vids = await videoLectureService.getLectures(id)
          setLectures(vids)
        } catch {
          setLectures([])
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
          
          try {
            const wishlist = await authService.getWishlist()
            setIsWishlisted(wishlist.some(c => c._id === id))
          } catch {
            setIsWishlisted(false)
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
      setActionMessage('You have unenrolled from this course.')
    } catch (err) {
      setActionMessage(err.message || 'Could not unenroll from this course')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!currentUser || currentUser.role !== 'student') return;
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
      setActionMessage(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
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

                      {/* VIDEO LECTURES */}
                      {enrolled && currentUser?.role === 'student' && lectures.filter(l => l.moduleOrder === mod.order).length > 0 && (
                        <div className="mt-4 space-y-3">
                          {lectures.filter(l => l.moduleOrder === mod.order).map((vid) => (
                            <div key={vid._id} className="rounded-lg bg-paper border border-line p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <PlayCircle size={16} className="text-primary" />
                                <span className="text-sm font-semibold text-ink">{vid.title}</span>
                              </div>
                              {/* Simple iframe for YouTube/Vimeo links. Fallback to anchor if it's just a regular link or we want a generic embed */}
                              <div className="aspect-video w-full rounded overflow-hidden bg-slate text-center flex flex-col justify-center items-center">
                                {vid.videoUrl.includes('youtube.com') || vid.videoUrl.includes('youtu.be') ? (
                                  <iframe 
                                    src={vid.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                    className="w-full h-full" 
                                    allowFullScreen
                                    title={vid.title}
                                  ></iframe>
                                ) : (
                                  <a href={vid.videoUrl} target="_blank" rel="noreferrer" className="text-paper hover:underline text-sm flex items-center gap-2">
                                    <PlayCircle size={20} /> Watch Video
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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

      <Footer />
    </div>
  )
}
