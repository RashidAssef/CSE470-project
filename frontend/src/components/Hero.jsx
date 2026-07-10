import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-alt px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-slate">
            Built for structured learning
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Every course is a
            <span className="relative mx-2 inline-block text-primary">
              path
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 120 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 7 C 30 2, 60 10, 118 4"
                  stroke="var(--color-amber)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            , not a pile of videos.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Pathway sequences lessons, quizzes, and assignments into a single
            guided route — so students always know the next step, and
            instructors always know who's stuck.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper-alt transition-transform hover:-translate-y-0.5 hover:bg-primary"
            >
              Start learning free
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              <PlayCircle size={18} />
              See how it works
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 font-mono text-xs text-slate">
            <span>NO CREDIT CARD REQUIRED</span>
            <span className="h-1 w-1 rounded-full bg-slate" />
            <span>FREE INSTRUCTOR ACCOUNTS</span>
          </div>
        </div>

        <div className="relative">
          <PathGraphic />
        </div>
      </div>
    </section>
  )
}

function PathGraphic() {
  const nodes = [
    { x: 40, y: 260, label: 'Enroll', tag: 'Module 01', color: 'var(--color-primary)' },
    { x: 175, y: 140, label: 'Watch & practice', tag: 'Module 02', color: 'var(--color-primary)' },
    { x: 300, y: 220, label: 'Take the quiz', tag: 'Module 03', color: 'var(--color-amber)' },
    { x: 400, y: 90, label: 'Get certified', tag: 'Module 04', color: 'var(--color-teal)' },
  ]

  return (
    <div className="rounded-3xl border border-line bg-paper-alt p-4 shadow-xl shadow-ink/5 sm:p-6">
      <svg viewBox="0 0 460 320" className="w-full" role="img" aria-label="Example learning path with four sequential modules">
        <path
          d="M40 260 C 90 190, 130 170, 175 140 S 260 150, 300 220 S 370 130, 400 90"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        {nodes.map((n, i) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="22" fill="var(--color-paper-alt)" stroke={n.color} strokeWidth="3" />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              className="font-mono"
              fontSize="12"
              fontWeight="600"
              fill="var(--color-ink)"
            >
              {i + 1}
            </text>
            <text
              x={n.x}
              y={n.y - 34}
              textAnchor="middle"
              fontSize="12"
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              fill="var(--color-ink)"
            >
              {n.label}
            </text>
            <text
              x={n.x}
              y={n.y + 44}
              textAnchor="middle"
              className="font-mono"
              fontSize="10"
              fill="var(--color-slate)"
            >
              {n.tag}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
