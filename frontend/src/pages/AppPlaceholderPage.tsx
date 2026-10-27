import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

/** "Coming soon" content for app sections not built yet, rendered inside AppShell. */
export default function AppPlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <title>{`${title} · TenderScout`}</title>
      <div className="grid gap-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Construction aria-hidden="true" className="size-6" />
            </span>
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold">{title} is coming soon</h2>
              <p className="text-muted-foreground">
                We're building this screen next.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
