import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { useSession } from "@/hooks/useSession"
import { safeNextPath } from "@/lib/redirect"
import { Navigate, Outlet, useSearchParams } from "react-router"

/**
 * Layout route for /login, /signup, /forgot-password and /reset-password:
 * signed-in (verified) users go to a safe `?next=` path or /dashboard.
 * This is also how /login and /verify-email finish: they put the new session
 * in the cache and this guard redirects. If the session check fails, the
 * page still renders.
 */
export function RedirectIfAuthed() {
  const [searchParams] = useSearchParams()
  const session = useSession()

  if (session.isPending) return <LoadingScreen label="Loading…" />
  if (session.data?.user.emailVerified) {
    return <Navigate to={safeNextPath(searchParams.get("next"))} replace />
  }
  return <Outlet />
}
