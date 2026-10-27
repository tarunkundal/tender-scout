import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { ConsentField } from "@/components/auth/ConsentField"
import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { PasswordRuleHints } from "@/components/auth/PasswordRuleHints"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { useAuthForm } from "@/hooks/useAuthForm"
import {
  authErrorKind,
  getSession,
  sendVerificationCode,
  signUpWithEmail,
} from "@/lib/api"
import { savePendingCompany } from "@/lib/pendingCompany"
import { SESSION_QUERY_KEY } from "@/lib/queryClient"
import {
  normalizeMobile,
  validateSignup,
  type SignupValues,
} from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { useNavigate } from "react-router"

const FIELD_IDS = {
  fullName: "signup-full-name",
  companyName: "signup-company-name",
  email: "signup-email",
  mobile: "signup-mobile",
  password: "signup-password",
  consent: "signup-consent",
} as const

const PASSWORD_RULES_ID = "signup-password-rules"

const INITIAL_VALUES: SignupValues = {
  fullName: "",
  companyName: "",
  email: "",
  mobile: "",
  password: "",
  consent: false,
}

export default function SignupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const summaryRef = useRef<HTMLDivElement>(null)
  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validate: validateSignup,
    fieldIds: FIELD_IDS,
    summaryRef,
  })
  const mutation = useMutation({
    mutationFn: async (values: SignupValues) => {
      const email = values.email.trim()
      const result = await signUpWithEmail({
        name: values.fullName.trim(),
        email,
        password: values.password,
      })
      // Neon Auth keeps only name/email/password; the company step reads the rest.
      savePendingCompany({
        companyName: values.companyName.trim(),
        mobile: normalizeMobile(values.mobile),
        consent: values.consent,
      })
      return { email, ...result }
    },
    onSuccess: async ({ email, needsVerification }) => {
      if (needsVerification) {
        // Neon's project config has `sendVerificationEmailOnSignUp: false`
        // (findings §14), so ask for the code explicitly. If that fails, the
        // code screen starts without a cooldown and offers "Resend code".
        let codeSent = true
        try {
          await sendVerificationCode(email)
        } catch {
          codeSent = false
        }
        void navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          state: { codeSent },
        })
        return
      }
      // Verification turned off in Neon: RedirectIfAuthed takes over once the
      // session is cached (then RequireAuth sends the user to /setup/company).
      queryClient.setQueryData(SESSION_QUERY_KEY, await getSession())
    },
    onError: (error) => {
      if (authErrorKind(error) === "user_exists") {
        form.showErrors(
          {
            email:
              "An account with this email already exists. Log in instead, or use another email.",
          },
          null,
        )
        return
      }
      form.handleServerError(error)
    },
  })
  const pending = mutation.isPending

  const { values, errors } = form

  return (
    <>
      <title>Create account · TenderScout</title>
      <AuthLayout
        title="Create account"
        subtitle="Set up your company profile in about five minutes."
        footer={
          <>
            Already have an account? <TextLink to="/login">Log in</TextLink>
          </>
        }
      >
        <div className="grid gap-6">
          <GoogleSignInButton next="/dashboard" />
          <AuthDivider />

          <form
            noValidate
            aria-busy={pending}
            className="grid gap-5"
            onSubmit={form.handleSubmit((v) => {
              if (pending) return
              mutation.mutate(v)
            })}
          >
            <AuthErrorSummary
              ref={summaryRef}
              items={form.summaryItems}
              formError={form.formError}
            />

            <TextField
              id={FIELD_IDS.fullName}
              name="fullName"
              label="Full name"
              autoComplete="name"
              required
              value={values.fullName}
              onChange={(e) => form.setValue("fullName", e.target.value)}
              onBlur={() => form.handleBlur("fullName")}
              error={errors.fullName}
            />

            <TextField
              id={FIELD_IDS.companyName}
              name="companyName"
              label="Company name"
              autoComplete="organization"
              required
              maxLength={200}
              value={values.companyName}
              onChange={(e) => form.setValue("companyName", e.target.value)}
              onBlur={() => form.handleBlur("companyName")}
              error={errors.companyName}
            />

            <TextField
              id={FIELD_IDS.email}
              name="email"
              type="email"
              label="Work email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={values.email}
              onChange={(e) => form.setValue("email", e.target.value)}
              onBlur={() => form.handleBlur("email")}
              error={errors.email}
            />

            <TextField
              id={FIELD_IDS.mobile}
              name="mobile"
              type="tel"
              inputMode="numeric"
              label="Mobile number"
              optional
              hint="10-digit Indian mobile number, without +91."
              autoComplete="tel"
              value={values.mobile}
              onChange={(e) => form.setValue("mobile", e.target.value)}
              onBlur={() => form.handleBlur("mobile")}
              error={errors.mobile}
            />

            <PasswordField
              id={FIELD_IDS.password}
              name="password"
              label="Password"
              autoComplete="new-password"
              required
              describedBy={PASSWORD_RULES_ID}
              value={values.password}
              onChange={(e) => form.setValue("password", e.target.value)}
              onBlur={() => form.handleBlur("password")}
              error={errors.password}
            >
              <PasswordRuleHints
                id={PASSWORD_RULES_ID}
                password={values.password}
              />
            </PasswordField>

            <ConsentField
              id={FIELD_IDS.consent}
              checked={values.consent}
              error={errors.consent}
              onCheckedChange={(checked) => form.setValue("consent", checked)}
              onBlur={() => form.handleBlur("consent")}
            />

            <SubmitButton
              pending={pending}
              label="Create account"
              pendingLabel="Creating account…"
            />
          </form>
        </div>
      </AuthLayout>
    </>
  )
}
