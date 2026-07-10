import {
  Route as RouteIcon,
  Video,
  ClipboardCheck,
  BarChart3,
  Award,
  MessageSquare,
  Bell,
  Search,
  LayoutDashboard,
} from 'lucide-react'

const features = [
  {
    icon: RouteIcon,
    title: 'Structured learning paths',
    description:
      'Instructors sequence modules in order, so students always see one clear next step instead of a scattered course list.',
    color: 'primary',
  },
  {
    icon: Video,
    title: 'Video lectures, on their time',
    description:
      'Upload lessons once. Students watch, pause, and rewatch at their own pace, from any device.',
    color: 'amber',
  },
  {
    icon: ClipboardCheck,
    title: 'Assignments & auto-graded quizzes',
    description:
      'Set deadlines, collect submissions, and let objective quizzes grade themselves — results appear instantly.',
    color: 'teal',
  },
  {
    icon: BarChart3,
    title: 'Progress you can see',
    description:
      'Every completed lesson, quiz, and assignment rolls up into a live completion percentage for each student.',
    color: 'primary',
  },
  {
    icon: Award,
    title: 'Certificates on completion',
    description:
      'Meet the requirements and a digital certificate is issued automatically — no manual sign-off needed.',
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'Discussion forums',
    description:
      'Students and instructors ask questions and share knowledge in a space attached directly to the course.',
    color: 'teal',
  },
  {
    icon: Bell,
    title: 'Announcements & alerts',
    description:
      'Deadlines, grades, and course updates reach students the moment they matter, not after the fact.',
    color: 'primary',
  },
  {
    icon: Search,
    title: 'Search that finds the right course',
    description:
      'Filter by category, instructor, or difficulty, and save favorites to a wishlist for later.',
    color: 'amber',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboards for every role',
    description:
      'Students track deadlines and grades; instructors monitor engagement and outcomes across every course.',
    color: 'teal',
  },
]

const colorMap = {
  primary: 'bg-primary-light text-primary-dark',
  amber: 'bg-amber/15 text-amber-dark',
  teal: 'bg-teal/15 text-teal',
}

export default function Features() {
  return (
    <section id="features" className="bg-paper py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wide text-primary">
            What's included
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            One platform, from first lesson to final certificate
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Everything instructors need to build a course, and everything
            students need to finish it.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-line bg-paper-alt p-6 transition-shadow hover:shadow-lg hover:shadow-ink/5"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[f.color]}`}
              >
                <f.icon size={20} strokeWidth={2} />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
