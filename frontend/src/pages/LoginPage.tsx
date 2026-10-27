import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import {
  AuthDivider,
  GoogleSignInButton,
} from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { useAuthForm } from "@/hooks/useAuthForm"
import {
  authErrorKind,
  sendVerificationCode,
  signInWithEmail,
  type SignInInput,
} from "@/lib/api"
import { SESSION_QUERY_KEY } from "@/lib/queryClient"
import { safeNextPath } from "@/lib/redirect"
import { validateLogin, type LoginValues } from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleAlert } from "lucide-react"
import { useRef } from "react"
import { useNavigate, useSearchParams } from "react-router"

const FIELD_IDS = {
  email: "login-email",
  password: "login-password",
} as const

const INITIAL_VALUES: LoginValues = { email: "", password: "" }

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  // Neon sends failed Google sign-ins back here with `?error=…`.
  const googleFailed = searchParams.has("error")
  const next = safeNextPath(searchParams.get("next"))
  const summaryRef = useRef<HTMLDivElement>(null)
  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validate: validateLogin,
    fieldIds: FIELD_IDS,
    summaryRef,
  })

  async function goVerify(email: string) {
    // Unverified accounts get no session: send a fresh code, then the code screen.
    let codeSent = true
    try {
      await sendVerificationCode(email)
    } catch {
      codeSent = false // The code screen still offers "Resend code".
    }
    void navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
      state: { codeSent },
    })
  }

  const mutation = useMutation({
    mutationFn: (input: SignInInput) => signInWithEmail(input),
    // RedirectIfAuthed sends the user to `next` once the session is cached.
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session)
    },
    onError: async (error, input) => {
      const kind = authErrorKind(error)
      if (kind === "email_not_verified") return goVerify(input.email)
      if (kind === "invalid_credentials") {
        form.showErrors({}, "Incorrect email or password.")
        return
      }
      if (kind === "rate_limited") {
        form.showErrors({}, "Too many attempts. Wait a minute and try again.")
        return
      }
      form.handleServerError(error)
    },
  })
  const pending = mutation.isPending

  return (
    <>
      <title>Log in · TenderScout</title>
      <AuthLayout
        title="Log in"
        subtitle="Welcome back. Log in to see your matched tenders."
        footer={
          <>
            New to TenderScout? <TextLink to="/signup">Create account</TextLink>
          </>
        }
      >
        <div className="grid gap-6">
          {googleFailed && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/60 bg-destructive/10 p-4 text-sm">
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              Google sign-in didn't finish. Please try again.
            </p>
          )}

          <GoogleSignInButton next={next} />
          <AuthDivider />

          <form
            noValidate
            aria-busy={pending}
            className="grid gap-5"
            onSubmit={form.handleSubmit((values) => {
              if (pending) return
              mutation.mutate({
                email: values.email.trim(),
                password: values.password,
              })
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

            <div className="grid gap-2">
              <PasswordField
                id={FIELD_IDS.password}
                name="password"
                label="Password"
                autoComplete="current-password"
                required
                value={form.values.password}
                onChange={(e) => form.setValue("password", e.target.value)}
                onBlur={() => form.handleBlur("password")}
                error={form.errors.password}
              />
              <TextLink
                to="/forgot-password"
                className="justify-self-end text-sm"
              >
                Forgot password?
              </TextLink>
            </div>

            <SubmitButton
              pending={pending}
              label="Log in"
              pendingLabel="Logging in…"
            />
          </form>
        </div>
      </AuthLayout>
    </>
  )
}
