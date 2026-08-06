import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Loader2, CheckCheck } from 'lucide-react'
import { notificationService } from '../services/api.js'
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount.js'
import { getNotificationDisplay, timeAgo } from '../utils/notificationDisplay.js'

export default function NotificationBell() {
  const { unreadCount, setUnreadCount } = useUnreadNotificationCount()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const containerRef = useRef(null)

  // Close the dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = async () => {
    const willOpen = !open
    setOpen(willOpen)

    if (willOpen && !hasFetched) {
      setLoading(true)
      try {
        const res = await notificationService.getMyNotifications()
        setNotifications(res.data)
        setUnreadCount(res.unreadCount)
        setHasFetched(true)
      } catch {
        // Leave the dropdown showing an empty state rather than crashing the navbar
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // no-op — worst case the user tries again
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // no-op
      }
    }
    setOpen(false)
  }

  const preview = notifications.slice(0, 6)

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-line bg-paper-alt shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            )}

            {!loading && preview.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate">
                No notifications yet.
              </p>
            )}

            {!loading &&
              preview.map((n) => {
                const { icon: Icon, color, bg } = getNotificationDisplay(n.type)
                return (
                  <Link
                    key={n._id}
                    to={n.link || '/notifications'}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-paper ${
                      !n.isRead ? 'bg-primary-light/40' : ''
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-ink-soft">
                        {n.message}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] text-slate">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line py-3 text-center text-sm font-semibold text-primary hover:bg-paper"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
