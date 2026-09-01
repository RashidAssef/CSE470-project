import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Loader2, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { forumService, authService } from '../services/api.js'
import { timeAgo } from '../utils/notificationDisplay.js'

export default function ThreadDetail() {
  const { id: courseId, threadId } = useParams()
  const navigate = useNavigate()
  const currentUser = authService.getCurrentUser()

  const [thread, setThread] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)

  const loadThread = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await forumService.getThread(courseId, threadId)
      setThread(data.thread)
      setPosts(data.posts)
    } catch (err) {
      setError(err.message || 'Could not load this thread')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }
    loadThread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, threadId])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return

    setReplying(true)
    try {
      const post = await forumService.createPost(courseId, threadId, reply.trim())
      setPosts((prev) => [...prev, post])
      setReply('')
    } catch (err) {
      setError(err.message || 'Could not post your reply')
    } finally {
      setReplying(false)
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      await forumService.deletePost(courseId, threadId, postId)
      setPosts((prev) => prev.filter((p) => p._id !== postId))
    } catch (err) {
      setError(err.message || 'Could not delete this post')
    }
  }

  const handleDeleteThread = async () => {
    try {
      await forumService.deleteThread(courseId, threadId)
      navigate(`/courses/${courseId}/forum`)
    } catch (err) {
      setError(err.message || 'Could not delete this thread')
    }
  }

  const canModerate = (authorId) =>
    currentUser &&
    (currentUser._id === authorId ||
      currentUser.role === 'admin' ||
      currentUser.role === 'instructor')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (error && !thread) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="text-ink-soft">{error}</p>
          <Link
            to={`/courses/${courseId}/forum`}
            className="mt-4 inline-block text-sm font-semibold text-primary"
          >
            ← Back to forum
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <Link
          to={`/courses/${courseId}/forum`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to forum
        </Link>

        <div className="mt-6 flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {thread?.title}
          </h1>
          {thread && canModerate(thread.createdBy?._id) && (
            <button
              onClick={handleDeleteThread}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-slate hover:border-red-300 hover:text-red-600"
            >
              <Trash2 size={13} />
              Delete thread
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-line bg-paper-alt p-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {posts.map((post, i) => (
            <div
              key={post._id}
              className={`rounded-2xl border p-5 ${
                i === 0 ? 'border-primary/30 bg-primary-light/30' : 'border-line bg-paper-alt'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-ink">
                      {post.author?.name || 'Unknown'}
                    </p>
                    {(post.author?.role === 'instructor' || post.author?.role === 'admin') && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 font-mono text-[10px] text-primary-dark">
                        <ShieldCheck size={10} />
                        {post.author.role}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate">
                    {timeAgo(post.createdAt)}
                  </p>
                </div>
                {canModerate(post.author?._id) && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-slate hover:text-red-600"
                    aria-label="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {post.content}
              </p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleReply}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-paper-alt p-5"
        >
          <label htmlFor="reply" className="text-sm font-semibold text-ink">
            Reply to this thread
          </label>
          <textarea
            id="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            maxLength={3000}
            className="rounded-xl border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={replying || !reply.trim()}
            className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {replying ? 'Posting...' : 'Post reply'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  )
}
