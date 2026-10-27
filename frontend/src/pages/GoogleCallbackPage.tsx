import { AuthLayout } from "@/components/layout/AuthLayout"
import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { Button } from "@/components/ui/button"
import { useSession } from "@/hooks/useSession"
import { safeNextPath } from "@/lib/redirect"
import { CircleAlert } from "lucide-react"
import { useState } from "react"
import { Link, Navigate } from "react-router"

/**
 * /auth/callback?next=…&neon_auth_session_verifier=… — where Neon sends the
 * browser after Google. `useSession()` (→ `getSession()`) runs before any
 * redirect: the SDK reads the verifier from the URL, exchanges it for the
 * session and strips it (findings.md §5). Then we route like a normal login.
 */
export default function GoogleCallbackPage() {
  // Read once on mount: the SDK removes the verifier with history.replaceState.
  const [next] = useState(() =>
    safeNextPath(new URLSearchParams(window.location.search).get("next")),
  )
  const session = useSession()

  if (session.isPending) return <LoadingScreen label="Signing you in…" />
  if (session.data?.user) return <Navigate to={next} replace />

  return (
    <>
      <title>Sign-in didn't finish · TenderScout</title>
      <AuthLayout
        title="Google sign-in didn't finish"
        subtitle="We couldn't start your session. Please try again."
      >
        <div className="grid gap-6">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-destructive"
            />
            If this keeps happening, allow cookies for this site or log in with
            your email and password.
          </p>
          <Button size="lg" className="w-full" asChild>
            <Link to="/login">Back to log in</Link>
          </Button>
        </div>
      </AuthLayout>
    </>
  )
}
