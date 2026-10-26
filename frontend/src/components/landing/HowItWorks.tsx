import { Building2, ClipboardCheck, Radar } from "lucide-react"

const STEPS = [
  {
    icon: Building2,
    title: "Tell us about your business",
    description:
      "Add your sector, turnover, certifications and the states you work in. It takes about five minutes.",
  },
  {
    icon: Radar,
    title: "Get matched tenders daily",
    description:
      "We scan GeM, CPPP and state portals and show you only the tenders that fit your profile.",
  },
  {
    icon: ClipboardCheck,
    title: "Know if you can bid and what to prepare",
    description:
      "See a Bid/No-Bid verdict, the conditions you meet, and a checklist of documents to prepare.",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      tabIndex={-1}
      className="scroll-mt-20 border-t focus:outline-none"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="how-title"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            How it works
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            From business profile to bid decision in three steps.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="flex flex-col gap-4 rounded-xl border bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-full bg-brand-soft font-mono text-sm font-semibold text-brand-soft-foreground"
                  >
                    {i + 1}
                  </span>
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
