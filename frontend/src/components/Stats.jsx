import { stats } from '../data/courses.js'

export default function Stats() {
  return (
    <section className="border-y border-line bg-ink">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center lg:text-left">
            <p className="font-display text-3xl font-semibold text-paper-alt sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-slate">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
