import { ApiError, type LoginInput, type SignupInput } from "@/lib/api"

/**
 * Fake auth responses used when `VITE_USE_MOCKS=true`.
 * - Login fails for `wrong@example.com`, succeeds for anything else.
 * - Signup fails for `taken@example.com`, succeeds for anything else.
 */
const DELAY_MS = 600

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin({ email }: LoginInput): Promise<void> {
  await delay(DELAY_MS)
  if (email.trim().toLowerCase() === "wrong@example.com") {
    throw new ApiError(401, "Incorrect email or password.")
  }
}

export async function mockSignup({ email }: SignupInput): Promise<void> {
  await delay(DELAY_MS)
  if (email.trim().toLowerCase() === "taken@example.com") {
    const message = "An account with this email already exists."
    throw new ApiError(409, message, { email: message })
  }
}
