export const DEFAULT_AUTHED_PATH = "/dashboard"

/**
 * Open-redirect guard for `?next=`: only same-site paths ("/tenders?x=1").
 * Rejects "//evil.com" and "/\evil.com" (browsers treat "\" like "/").
 */
export function safeNextPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return DEFAULT_AUTHED_PATH
  }
  return next
}
