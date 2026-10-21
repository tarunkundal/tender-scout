import type { ReactNode } from "react"

/**
 * Placeholder for the authenticated app shell (sidebar, top bar, alerts).
 * Built later together with the logged-in screens; not routed yet.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-svh">{children}</div>
}
