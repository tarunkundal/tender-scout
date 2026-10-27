import { useSession } from "@/hooks/useSession"
import { getMe } from "@/lib/api"
import { ME_QUERY_KEY, meQueryKey } from "@/lib/queryClient"
import { useQuery } from "@tanstack/react-query"

/**
 * `GET /me`: our backend's user + company. Keyed by the session's user id,
 * so after a session change (expiry, sign-out in another tab, a different
 * user logging in) the cached response of the previous user is never
 * shown. Only runs once a verified Neon session exists (`enabled`), so it
 * never fires for signed-out visitors.
 */
export function useMe({ enabled = true }: { enabled?: boolean } = {}) {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: userId ? meQueryKey(userId) : ME_QUERY_KEY,
    queryFn: getMe,
    enabled: enabled && Boolean(userId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
