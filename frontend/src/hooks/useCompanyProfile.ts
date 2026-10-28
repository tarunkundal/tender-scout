import { useSession } from "@/hooks/useSession"
import { getCompanyProfile } from "@/lib/api"
import {
  COMPANY_PROFILE_QUERY_KEY,
  companyProfileQueryKey,
} from "@/lib/queryClient"
import { useQuery } from "@tanstack/react-query"

/** `GET /company/profile`, keyed by the Neon user id (like `useMe`). */
export function useCompanyProfile() {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: userId
      ? companyProfileQueryKey(userId)
      : COMPANY_PROFILE_QUERY_KEY,
    queryFn: getCompanyProfile,
    enabled: Boolean(userId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
