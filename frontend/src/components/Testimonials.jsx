import { Star } from 'lucide-react'
import { testimonials } from '../data/courses.js'

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-primary-light py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wide text-primary-dark">
            Reviews & ratings
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            What learners say after they finish
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-2xl bg-paper-alt p-7 shadow-sm shadow-ink/5"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < t.rating ? 'fill-amber text-amber' : 'text-line'}
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                "{t.quote}"
              </p>
              <div className="mt-6 border-t border-line pt-4">
                <p className="font-display text-sm font-semibold text-ink">
                  {t.name}
                </p>
                <p className="text-xs text-slate">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
