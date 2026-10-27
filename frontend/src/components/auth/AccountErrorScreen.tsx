import { Logo } from "@/components/layout/Logo"
import { Button } from "@/components/ui/button"
import { useSignOut } from "@/hooks/useSignOut"
import { ApiError } from "@/lib/api"
import { CircleAlert, Loader2 } from "lucide-react"

/**
 * Full-page error when the session or `GET /me` fails (backend down, JWT
 * rejected). Offers "Try again" and "Log out" instead of redirecting, so a
 * rejected token can never bounce between /login and /dashboard.
 */
export function AccountErrorScreen({
  error,
  retrying,
  onRetry,
}: {
  error: unknown
  retrying: boolean
  onRetry: () => void
}) {
  const signOut = useSignOut()
  const message =
    error instanceof ApiError
      ? error.message
      : "Something went wrong. Please try again."

  return (
    <>
      <title>Something went wrong · TenderScout</title>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 text-center focus:outline-none"
      >
        <Logo />
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CircleAlert aria-hidden="true" className="size-6 text-destructive" />
          We couldn't load your account
        </h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry} disabled={retrying}>
            {retrying && (
              <Loader2 aria-hidden="true" className="animate-spin" />
            )}
            {retrying ? "Trying again…" : "Try again"}
          </Button>
          <Button
            variant="outline"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
          >
            {signOut.isPending ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </main>
    </>
  )
}
