import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, GraduationCap, BookOpen, Compass, Loader2 } from 'lucide-react'
import { authService, enrollmentService } from '../services/api.js'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)

    enrollmentService
      .getMyEnrollments()
      .then(setEnrollments)
      .catch((err) => setError(err.message || 'Failed to load your courses'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleUnenroll = async (enrollmentId) => {
    try {
      await enrollmentService.unenroll(enrollmentId)
      setEnrollments((prev) => prev.filter((e) => e._id !== enrollmentId))
    } catch (err) {
      setError(err.message || 'Could not unenroll from this course')
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <header className="border-b border-line bg-paper-alt">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-8">
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-red-300 hover:text-red-600"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              My enrolled courses
            </h1>
            <p className="mt-1 text-sm text-slate">
              {enrollments.length} course{enrollments.length === 1 ? '' : 's'} in progress
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Compass size={16} />
            Browse more courses
          </Link>
        </div>

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

          {!loading && !error && enrollments.length === 0 && (
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
          )}

          {!loading && !error && enrollments.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="flex flex-col rounded-2xl border border-line bg-paper-alt p-6"
                >
                  <span className="w-fit rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate">
                    {enrollment.course?.category?.name || 'General'}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                    {enrollment.course?.title || 'Course unavailable'}
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    {enrollment.course?.instructor?.name || 'Pathway Instructor'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <Link
                      to={`/courses/${enrollment.course?._id}`}
                      className="text-sm font-semibold text-primary"
                    >
                      View course →
                    </Link>
                    <button
                      onClick={() => handleUnenroll(enrollment._id)}
                      className="text-xs font-medium text-slate hover:text-red-600"
                    >
                      Unenroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
