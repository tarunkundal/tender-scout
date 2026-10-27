import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { useMe } from "@/hooks/useMe"
import { useSession } from "@/hooks/useSession"
import { ApiError } from "@/lib/api"
import { Navigate, Outlet, useLocation } from "react-router"
import { AccountErrorScreen } from "./AccountErrorScreen"

function verifyEmailPath(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`
}

/**
 * Layout route guard for logged-in screens, in this order:
 * signed out → /login?next=<here>; email not verified → /verify-email;
 * no company yet → /setup/company (skipped with `requireCompany={false}`,
 * which the setup route itself uses); otherwise render the child route.
 */
export function RequireAuth({
  requireCompany = true,
}: {
  requireCompany?: boolean
}) {
  const location = useLocation()
  const session = useSession()
  const user = session.data?.user
  const verified = user?.emailVerified === true
  const me = useMe({ enabled: verified })

  if (session.isPending) return <LoadingScreen label="Loading your account…" />
  if (session.isError) {
    return (
      <AccountErrorScreen
        error={session.error}
        retrying={session.isFetching}
        onRetry={() => void session.refetch()}
      />
    )
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  if (!verified) return <Navigate to={verifyEmailPath(user.email)} replace />

  if (me.isPending) return <LoadingScreen label="Loading your account…" />
  if (me.isError) {
    if (
      me.error instanceof ApiError &&
      me.error.code === "EMAIL_NOT_VERIFIED"
    ) {
      return <Navigate to={verifyEmailPath(user.email)} replace />
    }
    return (
      <AccountErrorScreen
        error={me.error}
        retrying={me.isFetching}
        onRetry={() => void me.refetch()}
      />
    )
  }

  if (requireCompany && !me.data.company) {
    return <Navigate to="/setup/company" replace />
  }
  return <Outlet />
}
