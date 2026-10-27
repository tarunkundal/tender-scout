/**
 * Company details typed on /signup, kept until /setup/company saves them.
 * Neon Auth only stores name, email and password, so the rest waits here
 * (this tab only) while the user verifies their email.
 */
export interface PendingCompany {
  companyName: string
  /** 10-digit Indian mobile number, digits only; "" if not given. */
  mobile: string
  consent: boolean
}

const STORAGE_KEY = "tenderscout.pendingCompany"

export function savePendingCompany(value: PendingCompany) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked or full: the setup step just starts empty.
  }
}

export function readPendingCompany(): PendingCompany | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<PendingCompany> | null
    if (!data || typeof data !== "object") return null
    return {
      companyName: typeof data.companyName === "string" ? data.companyName : "",
      mobile: typeof data.mobile === "string" ? data.mobile : "",
      consent: data.consent === true,
    }
  } catch {
    return null
  }
}

export function clearPendingCompany() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
