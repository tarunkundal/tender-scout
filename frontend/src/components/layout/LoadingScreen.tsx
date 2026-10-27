import { Loader2 } from "lucide-react"

/** Full-page loading state (e.g. while checking the session). */
export function LoadingScreen({ label }: { label: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-svh items-center justify-center px-4 focus:outline-none"
    >
      <div
        role="status"
        className="flex items-center gap-3 text-muted-foreground"
      >
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin text-brand"
        />
        <span>{label}</span>
      </div>
    </main>
  )
}
