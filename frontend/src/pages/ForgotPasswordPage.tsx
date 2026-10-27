import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/useAuthForm"
import { authErrorKind, requestPasswordReset } from "@/lib/api"
import { validateEmail } from "@/lib/validation"
import { useMutation } from "@tanstack/react-query"
import { MailCheck } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link } from "react-router"

const FIELD_IDS = { email: "forgot-email" } as const

export default function ForgotPasswordPage() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  // Email the reset link was requested for; set after a successful submit.
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useAuthForm({
    initialValues: { email: "" },
    validate: (values) => ({ email: validateEmail(values.email) }),
    fieldIds: FIELD_IDS,
    summaryRef,
  })
  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_data, email) => {
      // Swap to the confirmation, then focus its heading for screen readers.
      flushSync(() => setSentTo(email))
      headingRef.current?.focus()
    },
    onError: (error) => {
      if (authErrorKind(error) === "rate_limited") {
        form.showErrors({}, "Too many requests. Wait a minute and try again.")
        return
      }
      form.handleServerError(error)
    },
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
              If an account exists for{" "}
              <span className="font-medium break-all text-foreground">
                {sentTo}
              </span>
              , we've sent a link to reset the password.
            </>
          }
        >
          <div className="grid gap-6">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <MailCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
              />
              <p>
                The link works once and expires after a short time. Didn't get
                it? Check your spam or promotions folder.
              </p>
            </div>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link to="/login">Back to log in</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  return (
    <>
      <title>Reset password · TenderScout</title>
      <AuthLayout
        title="Reset password"
        headingRef={headingRef}
        subtitle="Enter your account email and we'll send you a link to set a new password."
        footer={
          <>
            Remembered it? <TextLink to="/login">Log in</TextLink>
          </>
        }
      >
        <form
          noValidate
          aria-busy={pending}
          className="grid gap-5"
          onSubmit={form.handleSubmit((values) => {
            if (pending) return
            mutation.mutate(values.email.trim())
          })}
        >
          <AuthErrorSummary
            ref={summaryRef}
            items={form.summaryItems}
            formError={form.formError}
          />

          <TextField
            id={FIELD_IDS.email}
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={form.values.email}
            onChange={(e) => form.setValue("email", e.target.value)}
            onBlur={() => form.handleBlur("email")}
            error={form.errors.email}
          />

          <SubmitButton
            pending={pending}
            label="Send reset link"
            pendingLabel="Sending link…"
          />
        </form>
      </AuthLayout>
    </>
  )
}
