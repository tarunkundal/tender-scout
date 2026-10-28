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

/** Same limits as the backend (`POST /me/company`: 2–200 characters). */
export function validateCompanyName(value: string) {
  const name = value.trim()
  if (!name) return "Enter your company name."
  if (name.length < 2) return "Enter at least 2 characters."
  if (name.length > 200) return "Use 200 characters or fewer."
  return undefined
}

const OTP_RE = /^\d{6}$/

/** Strips spaces so "123 456" is accepted. */
export function normalizeOtp(value: string) {
  return value.replace(/\s+/g, "")
}

export function validateOtp(value: string) {
  const otp = normalizeOtp(value)
  if (!otp) return "Enter the 6-digit code from the email."
  return OTP_RE.test(otp) ? undefined : "The code is 6 digits."
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
    companyName: validateCompanyName(values.companyName),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    password: validateNewPassword(values.password),
    consent: validateConsent(values.consent),
  }
}

function validateConsent(consent: boolean) {
  return consent
    ? undefined
    : "Agree to the Terms and Privacy Policy to continue."
}

export interface CompanySetupValues {
  companyName: string
  mobile: string
  consent: boolean
}

export function validateCompanySetup(
  values: CompanySetupValues,
): FieldErrors<keyof CompanySetupValues> {
  return {
    companyName: validateCompanyName(values.companyName),
    mobile: validateMobile(values.mobile),
    consent: validateConsent(values.consent),
  }
}

/**
 * Company profile form state (wizard and Settings). Choices start empty
 * (`""`); the API values are only built once validation passed.
 */
export interface ProfileValues {
  name: string
  mobile: string
  entityType: string
  states: string[]
  workTypes: string[]
  registrationAuthority: string
  registrationClass: string
  hasBidBefore: "" | "yes" | "no"
}

export type ProfileErrors = FieldErrors<keyof ProfileValues>

/** Wizard step 1 (Business). */
export function validateProfileBusiness(values: ProfileValues): ProfileErrors {
  return {
    entityType: values.entityType ? undefined : "Choose your business type.",
    states:
      values.states.length > 0
        ? undefined
        : "Choose at least one state where you work.",
  }
}

/** Wizard step 2 (Work). Same limits as the backend (class: 50 characters). */
export function validateProfileWork(values: ProfileValues): ProfileErrors {
  return {
    workTypes:
      values.workTypes.length > 0
        ? undefined
        : "Choose at least one type of work.",
    registrationAuthority: values.registrationAuthority
      ? undefined
      : "Choose where you are registered, or “Not registered yet”.",
    registrationClass:
      values.registrationAuthority !== "none" &&
      values.registrationClass.trim().length > 50
        ? "Use 50 characters or fewer."
        : undefined,
  }
}

/** Wizard step 3 (Experience). */
export function validateProfileExperience(
  values: ProfileValues,
): ProfileErrors {
  return {
    hasBidBefore: values.hasBidBefore
      ? undefined
      : "Tell us whether you have bid on a government tender before.",
  }
}

/** The whole profile (Settings). */
export function validateProfile(values: ProfileValues): ProfileErrors {
  return {
    name: validateCompanyName(values.name),
    mobile: validateMobile(values.mobile),
    ...validateProfileBusiness(values),
    ...validateProfileWork(values),
    ...validateProfileExperience(values),
  }
}

export function hasErrors(errors: Partial<Record<string, string>>) {
  return Object.values(errors).some(Boolean)
}
