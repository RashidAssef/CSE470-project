import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  BarChart3,
  CircleCheck,
  Loader2,
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { courseService, enrollmentService, authService } from '../services/api.js'

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

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await courseService.getCourseById(id)
        setCourse(data)

        // Only students who are logged in can have an enrollment status
        if (currentUser?.role === 'student') {
          const status = await enrollmentService.getEnrollmentStatus(id)
          setEnrolled(status.enrolled)
          setEnrollmentId(status.enrollmentId)
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

      <Footer />
    </div>
  )
}
