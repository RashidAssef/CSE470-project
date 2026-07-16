import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Route as RouteIcon } from 'lucide-react'
import { authService } from '../services/api.js'

const links = [
  { label: 'Explore courses', href: '/courses' },
  { label: 'Learning paths', href: '#how-it-works' },
  { label: 'For instructors', href: '#features' },
  { label: 'Reviews', href: '#testimonials' },
]

const isInternalLink = (href) => href.startsWith('/')

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  const handleLogout = () => {
    authService.logout()
    setOpen(false)
    navigate('/login')
  }

  const getDashboardPath = () => {
    if (!user) return '/'
    if (user.role === 'admin') return '/admin/dashboard'
    if (user.role === 'instructor') return '/instructor/dashboard'
    return '/student/dashboard'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper-alt/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper-alt">
            <RouteIcon size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Pathway<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) =>
            isInternalLink(link.href) ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                className="text-sm font-semibold text-ink-soft transition-colors hover:text-primary mr-2"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-50 border border-red-100 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-ink-soft transition-colors hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                Get started free
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper-alt px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {links.map((link) =>
              isInternalLink(link.href) ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-ink-soft"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-ink-soft"
                >
                  {link.label}
                </a>
              )
            )}
            <div className="mt-2 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-line px-5 py-2.5 text-center text-sm font-semibold text-ink"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-red-50 border border-red-100 px-5 py-2.5 text-center text-sm font-semibold text-red-600 cursor-pointer"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-line px-5 py-2.5 text-center text-sm font-semibold text-ink"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
