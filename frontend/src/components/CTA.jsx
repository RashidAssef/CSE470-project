import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="bg-ink py-20">
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-paper-alt sm:text-4xl">
          Start your first learning path today
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate">
          Free for students. Free for instructors publishing their first
          course. No credit card required.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
          >
            Create free account
            <ArrowRight size={16} />
          </Link>
          <a
            href="#courses"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-soft px-7 py-3.5 text-sm font-semibold text-paper-alt transition-colors hover:border-amber hover:text-amber"
          >
            Browse courses
          </a>
        </div>
      </div>
    </section>
  )
}
