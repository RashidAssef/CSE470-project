import { Route as RouteIcon } from 'lucide-react'

const columns = [
  {
    title: 'Platform',
    links: ['Browse courses', 'Learning paths', 'Certificates', 'Wishlist'],
  },
  {
    title: 'Instructors',
    links: ['Create a course', 'Instructor dashboard', 'Analytics', 'Grading tools'],
  },
  {
    title: 'Support',
    links: ['Help center', 'Discussion forum', 'Contact us', 'System status'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-paper-alt">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper-alt">
                <RouteIcon size={18} strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold text-ink">
                Pathway<span className="text-primary">.</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate">
              A guided learning platform where every course is a structured
              path from enrollment to certificate.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-ink">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="font-mono text-xs text-slate">
            © 2026 Pathway. A software engineering course project.
          </p>
          <div className="flex gap-6 font-mono text-xs text-slate">
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
