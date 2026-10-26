/**
 * Data access layer.
 *
 * ALL data access for the app lives in this file as async, typed functions
 * (e.g. `getTenders()`, `getTender(id)`, `getEligibility(id)`).
 * Components and hooks never call `fetch` directly.
 *
 * With `VITE_USE_MOCKS=true` the functions return mock data from `src/mocks`.
 * Otherwise they call the FastAPI backend at `VITE_API_BASE_URL`, so swapping
 * mocks for real data does not change any component.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"

/** Error thrown by every API function for a failed request. */
export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
  readonly status: number
  /** Per-field messages keyed by request field name (e.g. `email`). */
  readonly fieldErrors?: Record<string, string>

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

/** Builds an ApiError from a non-2xx response (`{ detail }` or `{ message, fieldErrors }`). */
async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Non-JSON error body: fall back to a generic message.
  }

  let message = FALLBACK_MESSAGE
  let fieldErrors: Record<string, string> | undefined
  if (body && typeof body === "object") {
    const data = body as {
      detail?: unknown
      message?: unknown
      fieldErrors?: unknown
    }
    if (typeof data.detail === "string") message = data.detail
    else if (typeof data.message === "string") message = data.message
    if (data.fieldErrors && typeof data.fieldErrors === "object") {
      fieldErrors = data.fieldErrors as Record<string, string>
    }
  }
  return new ApiError(response.status, message, fieldErrors)
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // The backend sets the JWT in an httpOnly cookie.
      credentials: "include",
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      "Can't reach TenderScout right now. Check your connection and try again.",
    )
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json().catch(() => undefined)) as T
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  fullName: string
  companyName: string
  email: string
  /** 10-digit Indian mobile number, digits only. */
  mobile?: string
  password: string
  consent: boolean
}

export async function login(input: LoginInput): Promise<void> {
  if (USE_MOCKS) {
    const { mockLogin } = await import("@/mocks/auth")
    return mockLogin(input)
  }
  await postJson<unknown>("/auth/login", input)
}

/** Creates the account; the backend then emails a verification link. */
export async function signup(input: SignupInput): Promise<void> {
  if (USE_MOCKS) {
    const { mockSignup } = await import("@/mocks/auth")
    return mockSignup(input)
  }
  await postJson<unknown>("/auth/signup", input)
}
