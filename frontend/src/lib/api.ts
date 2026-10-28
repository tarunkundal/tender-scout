/**
 * Data access layer.
 *
 * ALL data access for the app lives in this file as async, typed functions.
 * Components and hooks never call `fetch` or the auth client directly.
 *
 * - Auth (sign-up, sign-in, email code, password reset, Google) goes to
 *   Neon Managed Better Auth through `authClient` (src/lib/auth.ts).
 * - Our FastAPI backend is called through `apiFetch`, which sends the Neon
 *   JWT as `Authorization: Bearer`. In dev, `/api` is proxied to :8000.
 */
import { authClient } from "@/lib/auth"
import type { components } from "@/types/api"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api"

export type Me = components["schemas"]["MeResponse"]
export type CompanyCreate = components["schemas"]["CompanyCreate"]
export type CompanyProfile = components["schemas"]["CompanyProfile"]
export type CompanyProfileUpdate = components["schemas"]["CompanyProfileUpdate"]
export type OnboardingOptions = components["schemas"]["OnboardingOptions"]
export type EntityType = CompanyProfileUpdate["entity_type"]
export type StateCode = CompanyProfileUpdate["states"][number]
export type WorkType = CompanyProfileUpdate["work_types"][number]
export type RegistrationAuthority =
  CompanyProfileUpdate["registration_authority"]

/** Error thrown by every function in this file for a failed request. */
export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
  readonly status: number
  /** Machine-readable code (backend `code`, or the Neon Auth error code). */
  readonly code?: string
  /** Per-field messages keyed by frontend field name (e.g. `companyName`). */
  readonly fieldErrors?: Record<string, string>

  constructor(
    status: number,
    message: string,
    code?: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."
const NETWORK_MESSAGE =
  "Can't reach TenderScout right now. Check your connection and try again."
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again."

// ---------------------------------------------------------------------------
// Neon Auth
// ---------------------------------------------------------------------------

type SessionResult = Awaited<ReturnType<typeof authClient.getSession>>
/** `{ session, user }` from Neon Auth; `user.emailVerified` drives D2. */
export type AuthSession = NonNullable<SessionResult["data"]>

/**
 * What went wrong in a Neon Auth call, independent of how the SDK reported it.
 * The SDK normalizes most errors to snake_case codes (`invalid_credentials`,
 * `email_not_confirmed`, ...) and keeps the server message for the rest
 * (`Invalid OTP`, `OTP expired`, `Too many attempts`), see findings.md §14.
 */
export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_verified"
  | "user_exists"
  | "invalid_code"
  | "code_expired"
  | "too_many_attempts"
  | "rate_limited"
  | "invalid_token"
  | "user_not_found"
  | "network"
  | "other"

const AUTH_CODE_KINDS: Record<string, AuthErrorKind> = {
  // Normalized by the Neon SDK (thrown AuthApiError).
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_verified",
  user_already_exists: "user_exists",
  email_exists: "user_exists",
  over_request_rate_limit: "rate_limited",
  over_email_send_rate_limit: "rate_limited",
  bad_jwt: "invalid_token",
  user_not_found: "user_not_found",
  // Raw Better Auth codes (if a call ever returns `{ error }` instead).
  INVALID_EMAIL_OR_PASSWORD: "invalid_credentials",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  USER_ALREADY_EXISTS: "user_exists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "user_exists",
  INVALID_OTP: "invalid_code",
  OTP_EXPIRED: "code_expired",
  TOO_MANY_ATTEMPTS: "too_many_attempts",
  INVALID_TOKEN: "invalid_token",
  USER_NOT_FOUND: "user_not_found",
}

export function authErrorKind(error: unknown): AuthErrorKind {
  if (!(error instanceof ApiError)) return "other"
  if (error.status === 0) return "network"
  const byCode = error.code ? AUTH_CODE_KINDS[error.code] : undefined
  if (byCode) return byCode
  const message = error.message.toLowerCase()
  if (message.includes("too many attempts")) return "too_many_attempts"
  if (message.includes("invalid otp")) return "invalid_code"
  if (message.includes("otp expired")) return "code_expired"
  if (message.includes("already exists")) return "user_exists"
  if (message.includes("invalid token")) return "invalid_token"
  if (error.status === 429) return "rate_limited"
  return "other"
}

/** Converts whatever the SDK threw or returned as `error` into an ApiError. */
function toAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  // `fetch` itself failed (offline, DNS, CORS): the SDK rethrows a TypeError.
  if (error instanceof TypeError) return new ApiError(0, NETWORK_MESSAGE)
  if (error && typeof error === "object") {
    const data = error as {
      status?: unknown
      message?: unknown
      code?: unknown
    }
    const status = typeof data.status === "number" ? data.status : 500
    const message =
      typeof data.message === "string" && data.message
        ? data.message
        : FALLBACK_MESSAGE
    const code = typeof data.code === "string" ? data.code : undefined
    return new ApiError(status, message, code)
  }
  return new ApiError(500, FALLBACK_MESSAGE)
}

/**
 * Runs a Better Auth client call. The Neon SDK throws a normalized
 * `AuthApiError` on non-2xx responses; plain Better Auth returns `{ error }`.
 * Both end up as an ApiError here (findings.md §2, §14).
 */
async function authCall<T>(
  call: () => Promise<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  let result: { data: T | null; error: unknown }
  try {
    result = await call()
  } catch (error) {
    throw toAuthError(error)
  }
  if (result.error) throw toAuthError(result.error)
  return result.data
}

/** Current Neon Auth session, or `null` when signed out. */
export async function getSession(): Promise<AuthSession | null> {
  const data = await authCall(() => authClient.getSession())
  return data?.session && data.user ? data : null
}

function isJwt(token: string | undefined | null): token is string {
  return typeof token === "string" && token.split(".").length === 3
}

/**
 * JWT for our backend. The SDK swaps `session.token` for the JWT from the
 * `set-auth-jwt` header and caches it until shortly before `exp`, so calling
 * this before every request is cheap and keeps the token fresh (findings §6).
 */
async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  const token = session?.session.token
  return isJwt(token) ? token : null
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

/** Creates the account. Returns whether the email still needs verifying. */
export async function signUpWithEmail(
  input: SignUpInput,
): Promise<{ needsVerification: boolean }> {
  const data = await authCall(() => authClient.signUp.email(input))
  return { needsVerification: data?.user.emailVerified !== true }
}

export interface SignInInput {
  email: string
  password: string
}

/**
 * Signs in and returns the session. A successful sign-in with no readable
 * session afterwards usually means the browser blocks the auth cookie.
 */
export async function signInWithEmail(
  input: SignInInput,
): Promise<AuthSession> {
  await authCall(() => authClient.signIn.email(input))
  const session = await getSession()
  if (!session) {
    throw new ApiError(
      401,
      "You're signed in, but this browser blocked the sign-in cookie. Allow cookies for this site and try again.",
    )
  }
  return session
}

/**
 * Redirects to Google. Neon sends the user back to /auth/callback, which
 * reads the session before anything drops `neon_auth_session_verifier`.
 */
export async function signInWithGoogle(next: string): Promise<void> {
  const origin = window.location.origin
  const callbackURL = new URL("/auth/callback", origin)
  callbackURL.searchParams.set("next", next)
  await authCall(() =>
    authClient.signIn.social({
      provider: "google",
      callbackURL: callbackURL.toString(),
      errorCallbackURL: `${origin}/login`,
    }),
  )
}

export async function signOut(): Promise<void> {
  await authCall(() => authClient.signOut())
}

/** Emails a new 6-digit verification code. */
export async function sendVerificationCode(email: string): Promise<void> {
  await authCall(() =>
    authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    }),
  )
}

/**
 * Verifies the email with the 6-digit code. Neon signs the user in after
 * verification (`autoSignInAfterVerification`), so this returns the new
 * session, or `null` if the user still has to log in.
 */
export async function verifyEmailCode(input: {
  email: string
  otp: string
}): Promise<AuthSession | null> {
  await authCall(() => authClient.emailOtp.verifyEmail(input))
  return getSession()
}

/**
 * Emails a reset link to /reset-password?token=…. Unknown emails look the
 * same as known ones, so the page never reveals whether an account exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await authCall(() =>
      authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    )
  } catch (error) {
    if (authErrorKind(error) === "user_not_found") return
    throw error
  }
}

export async function resetPassword(input: {
  token: string
  newPassword: string
}): Promise<void> {
  await authCall(() => authClient.resetPassword(input))
}

// ---------------------------------------------------------------------------
// FastAPI backend
// ---------------------------------------------------------------------------

type ValidationIssue = { loc?: unknown; msg?: unknown }

/**
 * Builds an ApiError from a non-2xx backend response: `{ detail, code }`, or
 * FastAPI's 422 `{ detail: [{ loc, msg }], code }` mapped to frontend fields.
 */
async function toApiError(
  response: Response,
  fieldNames: Record<string, string>,
): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON error body: fall back to a generic message.
  }
  const data = (body && typeof body === "object" ? body : {}) as {
    detail?: unknown
    code?: unknown
  }
  const code = typeof data.code === "string" ? data.code : undefined

  if (response.status === 401) {
    return new ApiError(401, SESSION_EXPIRED_MESSAGE, code)
  }

  if (Array.isArray(data.detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of data.detail as ValidationIssue[]) {
      const loc = Array.isArray(issue.loc) ? issue.loc : []
      // ["body", "states", 2] → "states": the field, not the list index.
      const apiField = String(
        (loc[0] === "body" && loc.length > 1 ? loc[1] : loc.at(-1)) ?? "",
      )
      const field = fieldNames[apiField] ?? apiField
      if (field && typeof issue.msg === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.msg
      }
    }
    return new ApiError(
      response.status,
      "Please check the highlighted fields.",
      code,
      fieldErrors,
    )
  }

  const message =
    response.status < 500 && typeof data.detail === "string"
      ? data.detail
      : FALLBACK_MESSAGE
  return new ApiError(response.status, message, code)
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  /** Backend field name → frontend field name, for 422 field errors. */
  fieldNames?: Record<string, string>
}

/** Authenticated JSON request to our backend. */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, fieldNames = {} }: ApiFetchOptions = {},
): Promise<T> {
  const token = await getAccessToken()
  if (!token) {
    throw new ApiError(401, SESSION_EXPIRED_MESSAGE, "NOT_AUTHENTICATED")
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
  if (body !== undefined) headers["Content-Type"] = "application/json"

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, NETWORK_MESSAGE)
  }

  if (!response.ok) throw await toApiError(response, fieldNames)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** The signed-in user and their company (`null` until /setup/company). */
export function getMe(): Promise<Me> {
  return apiFetch<Me>("/me")
}

/** One-time company setup after sign-up. 409 `COMPANY_EXISTS` if done already. */
export function createCompany(input: CompanyCreate): Promise<Me> {
  return apiFetch<Me>("/me/company", {
    method: "POST",
    body: input,
    fieldNames: {
      company_name: "companyName",
      contact_mobile: "mobile",
      consent: "consent",
    },
  })
}

/** Option lists with labels for the profile wizard and settings (any signed-in user). */
export function getOnboardingOptions(): Promise<OnboardingOptions> {
  return apiFetch<OnboardingOptions>("/reference/onboarding")
}

/** The company profile. 409 `COMPANY_REQUIRED` before /setup/company. */
export function getCompanyProfile(): Promise<CompanyProfile> {
  return apiFetch<CompanyProfile>("/company/profile")
}

/** Saves the whole profile; the first complete save finishes onboarding. */
export function updateCompanyProfile(
  input: CompanyProfileUpdate,
): Promise<CompanyProfile> {
  return apiFetch<CompanyProfile>("/company/profile", {
    method: "PUT",
    body: input,
    fieldNames: {
      name: "name",
      contact_mobile: "mobile",
      entity_type: "entityType",
      states: "states",
      work_types: "workTypes",
      registration_authority: "registrationAuthority",
      registration_class: "registrationClass",
      has_bid_before: "hasBidBefore",
    },
  })
}
