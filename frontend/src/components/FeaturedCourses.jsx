import { Star, Users, Layers, Bookmark } from 'lucide-react'
import { Link } from 'react-router-dom'
import { courses } from '../data/courses.js'

const accentMap = {
  primary: 'border-t-primary',
  amber: 'border-t-amber',
  teal: 'border-t-teal',
}

export default function FeaturedCourses() {
  return (
    <section id="courses" className="bg-paper py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-xs uppercase tracking-wide text-primary">
              Featured courses
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Popular paths this month
            </h2>
          </div>

          <Link
            to="/courses"
            className="flex items-center gap-2 rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
          >
            Browse the full catalog →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`flex flex-col rounded-2xl border border-line border-t-4 bg-paper-alt p-6 ${accentMap[course.accent]}`}
            >
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate">
                  {course.category}
                </span>
                <button
                  aria-label={`Save ${course.title} to wishlist`}
                  className="text-slate transition-colors hover:text-primary"
                >
                  <Bookmark size={18} />
                </button>
              </div>

              <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
                {course.title}
              </h3>
              <p className="mt-1 text-sm text-slate">{course.instructor}</p>

              <div className="mt-4 flex items-center gap-1 text-sm">
                <Star size={15} className="fill-amber text-amber" />
                <span className="font-semibold text-ink">{course.rating}</span>
                <span className="text-slate">({course.reviews})</span>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {course.students.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Layers size={14} />
                  {course.modules} modules
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="font-display text-base font-semibold text-ink">
                  {course.price}
                </span>
                <span className="rounded-full bg-paper px-2.5 py-1 font-mono text-[11px] text-ink-soft">
                  {course.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
