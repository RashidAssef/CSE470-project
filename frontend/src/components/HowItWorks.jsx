const steps = [
  {
    number: '01',
    title: 'Browse & enroll',
    description:
      'Search by category, instructor, or difficulty, then enroll to unlock every lesson, file, and quiz in the course.',
  },
  {
    number: '02',
    title: 'Move through the path',
    description:
      'Watch video lectures, download materials, and complete modules in the order your instructor designed.',
  },
  {
    number: '03',
    title: 'Submit & get graded',
    description:
      'Turn in assignments before the deadline and take quizzes that score themselves the moment you finish.',
  },
  {
    number: '04',
    title: 'Earn your certificate',
    description:
      'Finish every requirement in the path and your certificate is generated automatically — ready to share.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-ink py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wide text-amber">
            The learning path
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-paper-alt sm:text-4xl">
            Four steps, one straight line to a certificate
          </h2>
        </div>

        <div className="relative mt-16">
          <div
            className="absolute left-0 right-0 top-6 hidden h-px bg-[repeating-linear-gradient(90deg,var(--color-ink-soft)_0,var(--color-ink-soft)_6px,transparent_6px,transparent_14px)] lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-10 lg:grid-cols-4 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber bg-ink font-mono text-sm font-semibold text-amber">
                  {step.number}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-paper-alt">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
