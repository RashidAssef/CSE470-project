import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pin, Plus, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { forumService, courseService, authService } from '../services/api.js'
import { timeAgo } from '../utils/notificationDisplay.js'

export default function CourseForum() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()

  const [course, setCourse] = useState(null)
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [courseData, threadData] = await Promise.all([
          courseService.getCourseById(courseId),
          forumService.getThreads(courseId),
        ])
        setCourse(courseData)
        setThreads(threadData)
      } catch (err) {
        setError(
          err.message || 'You must be enrolled in this course to view its discussion forum'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const handleCreateThread = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    setPosting(true)
    try {
      const { thread } = await forumService.createThread(courseId, {
        title: newTitle.trim(),
        content: newContent.trim(),
      })
      navigate(`/courses/${courseId}/forum/${thread._id}`)
    } catch (err) {
      setError(err.message || 'Could not create the thread')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to course
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Discussion forum
            </h1>
            <p className="mt-1 text-sm text-slate">
              {course?.title || 'Course'}
            </p>
          </div>
          {!error && (
            <button
              onClick={() => setShowNewThread((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Plus size={16} />
              New thread
            </button>
          )}
        </div>

        {error && (
          <p className="mt-8 rounded-2xl border border-line bg-paper-alt p-6 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && showNewThread && (
          <form
            onSubmit={handleCreateThread}
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-paper-alt p-5"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title"
              required
              maxLength={150}
              className="rounded-xl border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's your question or topic?"
              required
              rows={4}
              maxLength={3000}
              className="rounded-xl border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={posting}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {posting ? 'Posting...' : 'Post thread'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewThread(false)}
                className="text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!error && (
          <div className="mt-8">
            {threads.length === 0 ? (
              <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
                <MessageSquare className="mx-auto text-slate" size={32} />
                <p className="mt-4 text-sm text-ink-soft">
                  No discussions yet — start the first one.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {threads.map((thread) => (
                  <Link
                    key={thread._id}
                    to={`/courses/${courseId}/forum/${thread._id}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-paper-alt p-5 transition-shadow hover:shadow-lg hover:shadow-ink/5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {thread.isPinned && <Pin size={13} className="text-amber-dark" />}
                        <p className="truncate font-display text-base font-semibold text-ink">
                          {thread.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate">
                        Started by {thread.createdBy?.name || 'Unknown'} · {timeAgo(thread.createdAt)}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 font-mono text-xs text-slate">
                      <MessageSquare size={13} />
                      {thread.postCount}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
