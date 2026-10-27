import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/useAuthForm"
import {
  ApiError,
  authErrorKind,
  sendVerificationCode,
  verifyEmailCode,
} from "@/lib/api"
import { SESSION_QUERY_KEY } from "@/lib/queryClient"
import { normalizeOtp, validateOtp } from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleAlert, CircleCheck, Loader2, MailCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router"

const FIELD_IDS = { otp: "verify-code" } as const
const RESEND_COOLDOWN_S = 30

/** Counts down from `seconds` after each `start()`; 0 means "ready". */
function useCooldown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])
  return { secondsLeft, start: () => setSecondsLeft(RESEND_COOLDOWN_S) }
}

/**
 * Live-region text after a resend. It changes only twice (sent, then ready),
 * so the per-second countdown on the button is never announced.
 */
function resendSentMessage(secondsLeft: number) {
  return secondsLeft > 0
    ? `New code sent. You can request another in ${RESEND_COOLDOWN_S} seconds.`
    : "You can request a new code now."
}

function codeErrorMessage(error: unknown) {
  switch (authErrorKind(error)) {
    case "invalid_code":
      return "That code isn't right. Check the latest email and try again."
    case "code_expired":
      return "This code has expired. Send a new code and try again."
    case "too_many_attempts":
      return "Too many wrong attempts. Send a new code and try again."
    case "rate_limited":
      return "Too many requests. Wait a minute and try again."
    default:
      return null
  }
}

/** /verify-email?email=… — enter the 6-digit code Neon emailed. */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email")?.trim() ?? ""
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Signup and login just sent a code, so resend starts on cooldown.
  const codeSent =
    (location.state as { codeSent?: boolean } | null)?.codeSent === true
  const cooldown = useCooldown(codeSent ? RESEND_COOLDOWN_S : 0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  // Verified but not signed in automatically: show "Email verified" + Log in.
  const [verified, setVerified] = useState(false)

  const form = useAuthForm({
    initialValues: { otp: "" },
    validate: (values) => ({ otp: validateOtp(values.otp) }),
    fieldIds: FIELD_IDS,
    summaryRef,
  })

  const verify = useMutation({
    mutationFn: (otp: string) => verifyEmailCode({ email, otp }),
    onSuccess: (session) => {
      if (session) {
        queryClient.setQueryData(SESSION_QUERY_KEY, session)
        // RequireAuth sends users without a company to /setup/company.
        void navigate("/dashboard", { replace: true })
        return
      }
      flushSync(() => setVerified(true))
      headingRef.current?.focus()
    },
    onError: (error) => {
      const message = codeErrorMessage(error)
      if (message) form.showErrors({ otp: message }, null)
      else form.handleServerError(error)
    },
  })

  const resend = useMutation({
    mutationFn: () => sendVerificationCode(email),
    onSuccess: () => cooldown.start(),
  })
  const resendError =
    codeErrorMessage(resend.error) ??
    (resend.error instanceof ApiError
      ? resend.error.message
      : "Couldn't send a new code. Please try again.")

  if (!email) {
    return (
      <>
        <title>Verify your email · TenderScout</title>
        <AuthLayout
          title="Verify your email"
          subtitle="This link is missing the email address. Log in and we'll send you a new code."
        >
          <Button size="lg" className="w-full" asChild>
            <Link to="/login">Go to log in</Link>
          </Button>
        </AuthLayout>
      </>
    )
  }

  if (verified) {
    return (
      <>
        <title>Email verified · TenderScout</title>
        <AuthLayout
          title="Email verified"
          headingRef={headingRef}
          subtitle="Your email is verified. Log in to set up your company."
        >
          <div className="grid gap-6">
            <p className="flex items-center gap-2 text-sm">
              <CircleCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-success"
              />
              <span className="min-w-0 break-all">{email} is verified.</span>
            </p>
            <Button size="lg" className="w-full" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </AuthLayout>
      </>
    )
  }

  const verifying = verify.isPending
  const resendDisabled = resend.isPending || cooldown.secondsLeft > 0

  return (
    <>
      <title>Verify your email · TenderScout</title>
      <AuthLayout
        title="Check your email"
        headingRef={headingRef}
        subtitle={
          <>
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium break-all text-foreground">
              {email}
            </span>
            .
          </>
        }
        footer={
          <>
            Wrong email? <TextLink to="/signup">Sign up again</TextLink>
          </>
        }
      >
        <div className="grid gap-6">
          <form
            noValidate
            aria-busy={verifying}
            className="grid gap-5"
            onSubmit={form.handleSubmit((values) => {
              if (verifying) return
              verify.mutate(normalizeOtp(values.otp))
            })}
          >
            <AuthErrorSummary
              ref={summaryRef}
              items={form.summaryItems}
              formError={form.formError}
            />

            <TextField
              id={FIELD_IDS.otp}
              name="otp"
              label="Verification code"
              hint="The code expires a few minutes after it is sent."
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="font-mono text-lg tracking-[0.3em]"
              value={form.values.otp}
              onChange={(e) =>
                form.setValue("otp", e.target.value.replace(/\D/g, ""))
              }
              onBlur={() => form.handleBlur("otp")}
              error={form.errors.otp}
            />

            <SubmitButton
              pending={verifying}
              label="Verify email"
              pendingLabel="Verifying…"
            />
          </form>

          <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm">
            <p className="flex items-start gap-3 text-muted-foreground">
              <MailCheck
                aria-hidden="true"
                className="size-5 shrink-0 text-brand"
              />
              Didn't get it? Check your spam or promotions folder, or send a new
              code.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendDisabled}
              onClick={() => resend.mutate()}
            >
              {resend.isPending && (
                <Loader2 aria-hidden="true" className="animate-spin" />
              )}
              {resend.isPending
                ? "Sending code…"
                : cooldown.secondsLeft > 0
                  ? `Resend code in ${cooldown.secondsLeft}s`
                  : "Resend code"}
            </Button>
            <p aria-live="polite" className="text-sm">
              {resend.isError && (
                <span className="flex items-start gap-1.5 text-destructive">
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {resendError}
                </span>
              )}
              {resend.isSuccess && (
                <span className="flex items-start gap-1.5 text-foreground">
                  <CircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-success"
                  />
                  {resendSentMessage(cooldown.secondsLeft)}
                </span>
              )}
            </p>
          </div>
        </div>
      </AuthLayout>
    </>
  )
}
