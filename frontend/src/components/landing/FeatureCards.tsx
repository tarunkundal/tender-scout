import { BadgeIndianRupee, BellRing, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Proof for every answer",
    description:
      "Every fact links to the exact page in the tender PDF, so you can check it in seconds.",
  },
  {
    icon: BadgeIndianRupee,
    title: "MSME benefits built in",
    description:
      "We flag EMD exemptions, startup relaxations and Make in India purchase preference you qualify for.",
  },
  {
    icon: BellRing,
    title: "Alerts that matter",
    description:
      "Get notified about new matches, deadline changes and submission reminders. Nothing else.",
  },
]

export function FeatureCards() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-20 border-t"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="features-title"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Built for how tenders really work
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Less time reading 80-page PDFs, more time preparing bids you can
            win.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="gap-4 px-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft">
                  <Icon aria-hidden="true" className="size-5 text-brand" />
                </span>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
