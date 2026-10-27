import { createAuthClient } from "@neondatabase/neon-js/auth"

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL

if (!NEON_AUTH_URL) {
  throw new Error(
    "VITE_NEON_AUTH_URL is not set. Copy frontend/.env.example to frontend/.env and set it.",
  )
}

/**
 * Neon Managed Better Auth client (default vanilla adapter).
 * Only `src/lib/api.ts` calls it; components use the functions there.
 */
export const authClient = createAuthClient(NEON_AUTH_URL)
