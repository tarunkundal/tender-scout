import { getSession } from "@/lib/api"
import { SESSION_QUERY_KEY } from "@/lib/queryClient"
import { useQuery } from "@tanstack/react-query"

/**
 * Neon Auth session: `data` is `{ session, user }` when signed in, `null`
 * when signed out. Refetching is cheap: the SDK caches the session until
 * shortly before the JWT expires, so a refetch on mount/focus mostly hits
 * memory and keeps tabs in sync after a sign-out elsewhere.
 */
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    retry: false,
  })
}
