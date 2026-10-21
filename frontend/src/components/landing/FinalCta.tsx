import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title">
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-xl border bg-card bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.15),transparent_60%)] px-6 py-16 text-center">
          <h2
            id="cta-title"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Stop missing tenders you could win.
          </h2>
          <p className="text-lg text-muted-foreground">
            Set up your business profile in about five minutes.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Start free <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
