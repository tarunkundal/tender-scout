import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VerdictPreviewCard } from "./VerdictPreviewCard"

export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="brand">For Indian MSMEs</Badge>
          <h1
            id="hero-title"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
          >
            Find government tenders you can win, in minutes, not days.
          </h1>
          <p className="text-lg text-muted-foreground">
            TenderScout finds matching tenders, checks your eligibility, and
            builds your bid checklist, with a source for every answer.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/signup">
                Start free <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for MSMEs bidding on GeM, CPPP and state portals
          </p>
        </div>
        <VerdictPreviewCard />
      </div>
    </section>
  )
}
