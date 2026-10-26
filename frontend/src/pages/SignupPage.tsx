import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { FieldError } from "@/components/auth/FieldError"
import { PasswordField } from "@/components/auth/PasswordField"
import { PasswordRuleHints } from "@/components/auth/PasswordRuleHints"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuthForm } from "@/hooks/useAuthForm"
import { signup } from "@/lib/api"
import {
  normalizeMobile,
  validateSignup,
  type SignupValues,
} from "@/lib/validation"
import { useMutation } from "@tanstack/react-query"
import { MailCheck } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link } from "react-router"

const FIELD_IDS = {
  fullName: "signup-full-name",
  companyName: "signup-company-name",
  email: "signup-email",
  mobile: "signup-mobile",
  password: "signup-password",
  consent: "signup-consent",
} as const

const PASSWORD_RULES_ID = "signup-password-rules"
const CONSENT_ERROR_ID = `${FIELD_IDS.consent}-error`

const INITIAL_VALUES: SignupValues = {
  fullName: "",
  companyName: "",
  email: "",
  mobile: "",
  password: "",
  consent: false,
}

export default function SignupPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  // Email the verification link was sent to; set after a successful signup.
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validate: validateSignup,
    fieldIds: FIELD_IDS,
    summaryRef,
  })
  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (_data, variables) => {
      // Swap to the "Check your email" state, then focus its heading so
      // screen reader users hear the new state.
      flushSync(() => setSentTo(variables.email))
      headingRef.current?.focus()
    },
    onError: form.handleServerError,
  })
  const pending = mutation.isPending

  if (sentTo) {
    return (
      <>
        <title>Check your email · TenderScout</title>
        <AuthLayout
          title="Check your email"
          headingRef={headingRef}
          subtitle={
            <>
              We sent a verification link to{" "}
              <span className="font-medium break-all text-foreground">
                {sentTo}
              </span>
              . Open it to activate your account.
            </>
          }
        >
          <div className="grid gap-6">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <MailCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
              />
              <p>Didn't get it? Check your spam or promotions folder.</p>
            </div>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link to="/login">Back to log in</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  const { values, errors } = form

  return (
    <>
      <title>Create account · TenderScout</title>
      <AuthLayout
        title="Create account"
        headingRef={headingRef}
        subtitle="Set up your company profile in about five minutes."
        footer={
          <>
            Already have an account? <TextLink to="/login">Log in</TextLink>
          </>
        }
      >
        <form
          noValidate
          aria-busy={pending}
          className="grid gap-5"
          onSubmit={form.handleSubmit((v) => {
            if (pending) return
            const mobile = normalizeMobile(v.mobile)
            mutation.mutate({
              fullName: v.fullName.trim(),
              companyName: v.companyName.trim(),
              email: v.email.trim(),
              mobile: mobile || undefined,
              password: v.password,
              consent: v.consent,
            })
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

          <div className="grid gap-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id={FIELD_IDS.consent}
                name="consent"
                required
                className="mt-0.5 size-5"
                checked={values.consent}
                onCheckedChange={(checked) =>
                  form.setValue("consent", checked === true)
                }
                onBlur={() => form.handleBlur("consent")}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? CONSENT_ERROR_ID : undefined}
              />
              <Label
                htmlFor={FIELD_IDS.consent}
                className="block leading-snug font-normal"
              >
                I agree to the <TextLink to="/terms">Terms</TextLink> and{" "}
                <TextLink to="/privacy">Privacy Policy</TextLink>
              </Label>
            </div>
            <FieldError id={CONSENT_ERROR_ID} message={errors.consent} />
          </div>

          <SubmitButton
            pending={pending}
            label="Create account"
            pendingLabel="Creating account…"
          />
        </form>
      </AuthLayout>
    </>
  )
}
