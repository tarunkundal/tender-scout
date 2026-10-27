import { Button } from "@/components/ui/button"
import { ApiError, signInWithGoogle } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { CircleAlert, Loader2 } from "lucide-react"

/** Google "G" mark (decorative; the button text names the action). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.28a12 12 0 0 0 0 10.8l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.94 11.94 0 0 0 12 0 12 12 0 0 0 1.28 6.6l4.01 3.11C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  )
}

/**
 * "Continue with Google" (outline button). On success the browser leaves the
 * page, so the pending state simply stays until the redirect happens.
 */
export function GoogleSignInButton({ next }: { next: string }) {
  const mutation = useMutation({ mutationFn: () => signInWithGoogle(next) })
  const pending = mutation.isPending || mutation.isSuccess
  const errorMessage =
    mutation.error instanceof ApiError && mutation.error.status === 0
      ? mutation.error.message
      : "Couldn't start Google sign-in. Please try again."

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => mutation.mutate()}
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      <p aria-live="polite" className="text-sm">
        {mutation.isError && (
          <span className="flex items-start gap-1.5 text-destructive">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {errorMessage}
          </span>
        )}
      </p>
    </div>
  )
}

/** "or" separator between Google and the email form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      or use your email
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  )
}
