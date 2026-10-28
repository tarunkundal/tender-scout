import { QueryClient } from "@tanstack/react-query"

/** Shared TanStack Query client (App provides it; auth pages update the session cache). */
export const queryClient = new QueryClient()

/** Neon Auth session (`getSession()`); `null` means signed out. */
export const SESSION_QUERY_KEY = ["session"] as const

/** Prefix of every `GET /me` entry (use it to invalidate all of them). */
export const ME_QUERY_KEY = ["me"] as const

/**
 * Our backend's view of one signed-in user (`GET /me`), keyed by the Neon
 * user id so a different user in the same tab never reads a cached
 * response that belongs to someone else.
 */
export function meQueryKey(userId: string) {
  return [...ME_QUERY_KEY, userId] as const
}

/** Option lists for the profile forms (`GET /reference/onboarding`). */
export const ONBOARDING_OPTIONS_QUERY_KEY = ["onboarding-options"] as const

/** Prefix of every `GET /company/profile` entry. */
export const COMPANY_PROFILE_QUERY_KEY = ["company-profile"] as const

/** The signed-in user's company profile, keyed like `meQueryKey`. */
export function companyProfileQueryKey(userId: string) {
  return [...COMPANY_PROFILE_QUERY_KEY, userId] as const
}
