import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { ConsentField } from "@/components/auth/ConsentField"
import { SubmitButton } from "@/components/auth/SubmitButton"
import { TextField } from "@/components/auth/TextField"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/useAuthForm"
import { useMe } from "@/hooks/useMe"
import { useSession } from "@/hooks/useSession"
import { useSignOut } from "@/hooks/useSignOut"
import { ApiError, createCompany } from "@/lib/api"
import { clearPendingCompany, readPendingCompany } from "@/lib/pendingCompany"
import { ME_QUERY_KEY, meQueryKey } from "@/lib/queryClient"
import {
  normalizeMobile,
  validateCompanySetup,
  type CompanySetupValues,
} from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Navigate, useNavigate } from "react-router"

const FIELD_IDS = {
  companyName: "setup-company-name",
  mobile: "setup-mobile",
  consent: "setup-consent",
} as const

/**
 * /setup/company: one-time step after the first sign-in (inside RequireAuth
 * with `requireCompany={false}`). Prefilled from /signup; Google users start
 * empty. Consent is required here even if it was given on /signup, because
 * this is where the backend records it.
 */
export default function SetupCompanyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id
  const { data: me } = useMe()
  const signOut = useSignOut()
  const summaryRef = useRef<HTMLDivElement>(null)
  const [initialValues] = useState<CompanySetupValues>(() => {
    const pending = readPendingCompany()
    return {
      companyName: pending?.companyName ?? "",
      mobile: pending?.mobile ?? "",
      consent: pending?.consent ?? false,
    }
  })
  const form = useAuthForm({
    initialValues,
    validate: validateCompanySetup,
    fieldIds: FIELD_IDS,
    summaryRef,
  })

  function finish() {
    clearPendingCompany()
    // Next onboarding step; it sends finished profiles on to /dashboard.
    void navigate("/setup/profile", { replace: true })
  }

  const mutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (nextMe) => {
      if (userId) queryClient.setQueryData(meQueryKey(userId), nextMe)
      finish()
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === "COMPANY_EXISTS") {
        // Set up already (e.g. in another tab): load it and move on.
        await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
        finish()
        return
      }
      form.handleServerError(error)
    },
  })
  const pending = mutation.isPending

  // RequireAuth renders this only after /me loaded.
  if (!me) return null
  if (me.company && !pending) {
    return (
      <Navigate
        to={me.company.profile_completed ? "/dashboard" : "/setup/profile"}
        replace
      />
    )
  }

  const { values, errors } = form

  return (
    <>
      <title>Set up your company · TenderScout</title>
      <AuthLayout
        title="Set up your company"
        subtitle="Tell us who is bidding. Next, a few questions about your work."
        footer={
          <>
            Signed in as{" "}
            <span className="font-medium break-all text-foreground">
              {me.user.email}
            </span>
            .{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              {signOut.isPending ? "Logging out…" : "Log out"}
            </Button>
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
              company_name: v.companyName.trim(),
              contact_mobile: mobile || null,
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

          <ConsentField
            id={FIELD_IDS.consent}
            checked={values.consent}
            error={errors.consent}
            onCheckedChange={(checked) => form.setValue("consent", checked)}
            onBlur={() => form.handleBlur("consent")}
          />

          <SubmitButton
            pending={pending}
            label="Save and continue"
            pendingLabel="Saving…"
          />
        </form>
      </AuthLayout>
    </>
  )
}
