import { useEffect, useRef, useState } from 'react'
import { notificationService, authService } from '../services/api.js'

const POLL_INTERVAL_MS = 20000 // 20 seconds

/**
 * Polls the unread notification count for the logged-in user.
 * Deliberately polls just the lightweight /unread-count endpoint rather than
 * the full notification list, so this can run continuously in the
 * background (e.g. from the navbar) without hammering the API.
 */
export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user) return

    const poll = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch {
        // Silently ignore — a failed poll shouldn't surface an error to the user,
        // it'll just try again on the next interval.
      }
    }

    poll() // fetch immediately on mount, then start the interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
  }, [])

  return { unreadCount, setUnreadCount }
}
