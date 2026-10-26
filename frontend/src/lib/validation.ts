/**
 * Small validation helpers for the auth forms (no schema library by design).
 * Each validator returns an error message, or `undefined` when the value is valid.
 */

export type FieldErrors<K extends string> = Partial<Record<K, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /^[6-9]\d{9}$/

export const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "letter",
    label: "Contains a letter",
    test: (value: string) => /\p{L}/u.test(value),
  },
  {
    id: "number",
    label: "Contains a number",
    test: (value: string) => /\d/.test(value),
  },
] as const

/** Strips spaces so "98765 43210" is accepted as a 10-digit number. */
export function normalizeMobile(value: string) {
  return value.replace(/\s+/g, "")
}

export function validateRequired(value: string, message: string) {
  return value.trim() ? undefined : message
}

export function validateEmail(value: string) {
  const email = value.trim()
  if (!email) return "Enter your email address."
  if (!EMAIL_RE.test(email)) {
    return "Enter an email address like name@company.com."
  }
  return undefined
}

/** Optional: empty is valid, otherwise 10 digits starting 6-9. */
export function validateMobile(value: string) {
  const mobile = normalizeMobile(value)
  if (!mobile) return undefined
  return MOBILE_RE.test(mobile)
    ? undefined
    : "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
}

export function validateNewPassword(value: string) {
  if (!value) return "Create a password."
  return PASSWORD_RULES.every((rule) => rule.test(value))
    ? undefined
    : "Use at least 8 characters, including a letter and a number."
}

export interface LoginValues {
  email: string
  password: string
}

export function validateLogin(
  values: LoginValues,
): FieldErrors<keyof LoginValues> {
  return {
    email: validateEmail(values.email),
    password: values.password ? undefined : "Enter your password.",
  }
}

export interface SignupValues {
  fullName: string
  companyName: string
  email: string
  mobile: string
  password: string
  consent: boolean
}

export function validateSignup(
  values: SignupValues,
): FieldErrors<keyof SignupValues> {
  return {
    fullName: validateRequired(values.fullName, "Enter your full name."),
    companyName: validateRequired(
      values.companyName,
      "Enter your company name.",
    ),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    password: validateNewPassword(values.password),
    consent: values.consent
      ? undefined
      : "Agree to the Terms and Privacy Policy to continue.",
  }
}

export function hasErrors(errors: Partial<Record<string, string>>) {
  return Object.values(errors).some(Boolean)
}
