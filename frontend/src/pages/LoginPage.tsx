import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { PasswordField } from "@/components/auth/PasswordField"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { TextLink } from "@/components/auth/TextLink"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { useAuthForm } from "@/hooks/useAuthForm"
import { login } from "@/lib/api"
import { validateLogin, type LoginValues } from "@/lib/validation"
import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"
import { useNavigate } from "react-router"

const FIELD_IDS = {
  email: "login-email",
  password: "login-password",
} as const

const INITIAL_VALUES: LoginValues = { email: "", password: "" }

export default function LoginPage() {
  const navigate = useNavigate()
  const summaryRef = useRef<HTMLDivElement>(null)
  const form = useAuthForm({
    initialValues: INITIAL_VALUES,
    validate: validateLogin,
    fieldIds: FIELD_IDS,
    summaryRef,
  })
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      void navigate("/dashboard", { replace: true })
    },
    onError: form.handleServerError,
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
      </AuthLayout>
    </>
  )
}
