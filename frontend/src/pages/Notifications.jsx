import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, CheckCheck, Trash2, Bell } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { notificationService, authService } from '../services/api.js'
import { getNotificationDisplay, timeAgo } from '../utils/notificationDisplay.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!authService.getCurrentUser()) {
      navigate('/login')
      return
    }

    notificationService
      .getMyNotifications()
      .then((res) => setNotifications(res.data))
      .catch((err) => setError(err.message || 'Failed to load notifications'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      setError(err.message || 'Could not mark notifications as read')
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      setError(err.message || 'Could not update this notification')
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete this notification')
    }
  }

  const visible = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true))
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You\'re all caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-ink text-paper-alt'
                  : 'border border-line text-ink-soft hover:border-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
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

          {!loading && !error && visible.length === 0 && (
            <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
              <Bell className="mx-auto text-slate" size={32} />
              <p className="mt-4 text-sm text-ink-soft">
                {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
              </p>
              <Link to="/courses" className="mt-4 inline-block text-sm font-semibold text-primary">
                Browse courses →
              </Link>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="flex flex-col gap-3">
              {visible.map((n) => {
                const { icon: Icon, color, bg } = getNotificationDisplay(n.type)
                return (
                  <div
                    key={n._id}
                    className={`flex gap-4 rounded-2xl border border-line p-4 ${
                      !n.isRead ? 'bg-primary-light/30' : 'bg-paper-alt'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
                      <Icon size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-sm font-semibold text-ink">{n.title}</p>
                        <span className="shrink-0 font-mono text-[11px] text-slate">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{n.message}</p>

                      <div className="mt-3 flex items-center gap-4">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => !n.isRead && handleMarkRead(n._id)}
                            className="text-xs font-semibold text-primary"
                          >
                            View →
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n._id)}
                            className="text-xs font-medium text-slate hover:text-ink"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="ml-auto flex items-center gap-1 text-xs font-medium text-slate hover:text-red-600"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
