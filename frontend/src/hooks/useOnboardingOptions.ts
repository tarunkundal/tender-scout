import { useSession } from "@/hooks/useSession"
import { getOnboardingOptions } from "@/lib/api"
import { ONBOARDING_OPTIONS_QUERY_KEY } from "@/lib/queryClient"
import { useQuery } from "@tanstack/react-query"

/**
 * `GET /reference/onboarding`: entity types, states, work types and
 * registration authorities with their labels. Fixed lists, so they are
 * fetched once per session and never refetched in the background.
 */
export function useOnboardingOptions() {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: ONBOARDING_OPTIONS_QUERY_KEY,
    queryFn: getOnboardingOptions,
    enabled: Boolean(userId),
    retry: false,
    staleTime: Infinity,
  })
}
