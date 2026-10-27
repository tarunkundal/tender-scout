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
