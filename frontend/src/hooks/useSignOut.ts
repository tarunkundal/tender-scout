import { signOut } from "@/lib/api"
import { clearPendingCompany } from "@/lib/pendingCompany"
import { SESSION_QUERY_KEY } from "@/lib/queryClient"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"

/** "Log out": Neon `signOut()`, clear every cached query, go to /login. */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: signOut,
    // Clear local state even if the request failed, so the user is never stuck.
    onSettled: () => {
      clearPendingCompany()
      queryClient.removeQueries()
      queryClient.setQueryData(SESSION_QUERY_KEY, null)
      // The navigation commits synchronously (flushSync), before TanStack
      // notifies RequireAuth (setTimeout), so RequireAuth never redirects to
      // /login?next=… first. /login then reads the `null` session above.
      void navigate("/login", { replace: true, flushSync: true })
    },
  })
}
