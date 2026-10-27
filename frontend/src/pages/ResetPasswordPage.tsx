import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { PasswordField } from "@/components/auth/PasswordField"
import { PasswordRuleHints } from "@/components/auth/PasswordRuleHints"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/useAuthForm"
import { authErrorKind, resetPassword } from "@/lib/api"
import { validateNewPassword } from "@/lib/validation"
import { useMutation } from "@tanstack/react-query"
import { CircleCheck } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link, useSearchParams } from "react-router"

type Status = "form" | "success" | "invalid"

const FIELD_IDS = { password: "reset-password" } as const
const PASSWORD_RULES_ID = "reset-password-rules"

/**
 * /reset-password?token=… — Neon's reset email links here. A bad or expired
 * link arrives as `?error=INVALID_TOKEN` (Better Auth) instead of a token.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const linkFailed = searchParams.has("error")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>(
    token && !linkFailed ? "form" : "invalid",
  )
  const form = useAuthForm({
    initialValues: { password: "" },
    validate: (values) => ({ password: validateNewPassword(values.password) }),
    fieldIds: FIELD_IDS,
    summaryRef,
  })

  function showStatus(next: Status) {
    // Swap the screen, then focus its heading so screen readers hear it.
    flushSync(() => setStatus(next))
    headingRef.current?.focus()
  }

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => showStatus("success"),
    onError: (error) => {
      if (authErrorKind(error) === "invalid_token") {
        showStatus("invalid")
        return
      }
      form.handleServerError(error)
    },
  })
  const pending = mutation.isPending

  if (status === "success") {
    return (
      <>
        <title>Password reset · TenderScout</title>
        <AuthLayout
          title="Password reset"
          headingRef={headingRef}
          subtitle="Log in with your new password."
        >
          <div className="grid gap-6">
            <p className="flex items-center gap-2 text-sm">
              <CircleCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-success"
              />
              Your password has been changed.
            </p>
            <Button size="lg" className="w-full" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  if (status === "invalid") {
    return (
      <>
        <title>Link invalid or expired · TenderScout</title>
        <AuthLayout
          title="This link is invalid or has expired"
          headingRef={headingRef}
          subtitle="Reset links work once and expire after a short time."
        >
          <Button size="lg" className="w-full" asChild>
            <Link to="/forgot-password">Request a new reset link</Link>
          </Button>
        </AuthLayout>
      </>
    )
  }

  return (
    <>
      <title>Set a new password · TenderScout</title>
      <AuthLayout
        title="Set a new password"
        headingRef={headingRef}
        subtitle="Choose a new password for your TenderScout account."
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
            if (pending || !token) return
            mutation.mutate({ token, newPassword: values.password })
          })}
        >
          <AuthErrorSummary
            ref={summaryRef}
            items={form.summaryItems}
            formError={form.formError}
          />

          <PasswordField
            id={FIELD_IDS.password}
            name="password"
            label="New password"
            autoComplete="new-password"
            required
            describedBy={PASSWORD_RULES_ID}
            value={form.values.password}
            onChange={(e) => form.setValue("password", e.target.value)}
            onBlur={() => form.handleBlur("password")}
            error={form.errors.password}
          >
            <PasswordRuleHints
              id={PASSWORD_RULES_ID}
              password={form.values.password}
            />
          </PasswordField>

          <SubmitButton
            pending={pending}
            label="Reset password"
            pendingLabel="Resetting password…"
          />
        </form>
      </AuthLayout>
    </>
  )
}
