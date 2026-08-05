import { UserPlus, UserMinus, ClipboardList, HelpCircle, Award, Megaphone, Bell } from 'lucide-react'

export const notificationDisplay = {
  enrollment: { icon: UserPlus, color: 'text-teal', bg: 'bg-teal/10' },
  unenrollment: { icon: UserMinus, color: 'text-slate', bg: 'bg-paper' },
  assignment: { icon: ClipboardList, color: 'text-amber-dark', bg: 'bg-amber/10' },
  quiz: { icon: HelpCircle, color: 'text-primary-dark', bg: 'bg-primary-light' },
  grade: { icon: Award, color: 'text-amber-dark', bg: 'bg-amber/10' },
  announcement: { icon: Megaphone, color: 'text-primary-dark', bg: 'bg-primary-light' },
  general: { icon: Bell, color: 'text-slate', bg: 'bg-paper' },
}

export function getNotificationDisplay(type) {
  return notificationDisplay[type] || notificationDisplay.general
}

/** Turns a Date/ISO string into "2m ago", "3h ago", "5d ago", etc. */
export function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}
