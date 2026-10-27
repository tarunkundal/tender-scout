import { Logo } from "@/components/layout/Logo"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

/** Full-page placeholder for public screens not built yet (/terms, /privacy). */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <title>{`${title} · TenderScout`}</title>
      <main
        id="main-content"
        className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 text-center"
      >
        <Logo />
        <h1 className="text-3xl font-semibold tracking-tight">
          {title} is coming soon
        </h1>
        <p className="text-muted-foreground">
          We're building this screen next.
        </p>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </>
  )
}
