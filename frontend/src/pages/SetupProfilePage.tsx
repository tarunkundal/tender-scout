import { AccountErrorScreen } from "@/components/auth/AccountErrorScreen"
import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { LoadingScreen } from "@/components/layout/LoadingScreen"
import {
  BusinessFields,
  ExperienceFields,
  WorkFields,
  type ProfileFieldsProps,
} from "@/components/profile/ProfileFields"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/useAuthForm"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { useMe } from "@/hooks/useMe"
import { useOnboardingOptions } from "@/hooks/useOnboardingOptions"
import { useSession } from "@/hooks/useSession"
import { useSignOut } from "@/hooks/useSignOut"
import {
  ApiError,
  updateCompanyProfile,
  type CompanyProfile,
  type Me,
  type OnboardingOptions,
} from "@/lib/api"
import {
  PROFILE_FIELD_IDS,
  profileToValues,
  valuesToUpdate,
  withSavedProfile,
} from "@/lib/profile"
import { companyProfileQueryKey, meQueryKey } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
import {
  validateProfileBusiness,
  validateProfileExperience,
  validateProfileWork,
  type ProfileErrors,
  type ProfileValues,
} from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { useRef, useState, type ComponentType, type FormEvent } from "react"
import { flushSync } from "react-dom"
import { Navigate, useNavigate } from "react-router"

interface WizardStep {
  /** Short name in the step indicator. */
  title: string
  heading: string
  description: string
  fields: readonly (keyof ProfileValues)[]
  validate: (values: ProfileValues) => ProfileErrors
  Fields: ComponentType<ProfileFieldsProps>
}

const STEPS: readonly WizardStep[] = [
  {
    title: "Business",
    heading: "Your business",
    description: "Your business type and the states where you take up work.",
    fields: ["entityType", "states"],
    validate: validateProfileBusiness,
    Fields: BusinessFields,
  },
  {
    title: "Work",
    heading: "Your work",
    description: "The civil works you do and where you are registered.",
    fields: ["workTypes", "registrationAuthority", "registrationClass"],
    validate: validateProfileWork,
    Fields: WorkFields,
  },
  {
    title: "Experience",
    heading: "Your bidding experience",
    description: "This helps us decide how much guidance to show you.",
    fields: ["hasBidBefore"],
    validate: validateProfileExperience,
    Fields: ExperienceFields,
  },
]

/** "1. Business ✓ 2. Work 3. Experience" with `aria-current="step"`. */
function StepIndicator({ step }: { step: number }) {
  return (
    <ol aria-label="Setup steps" className="grid grid-cols-3 gap-2">
      {STEPS.map((item, index) => {
        const done = index < step
        const current = index === step
        return (
          <li key={item.title} aria-current={current ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={cn(
                "block h-1.5 rounded-full",
                done || current ? "bg-brand" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "mt-2 flex items-center gap-1 text-xs",
                current
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {done && (
                <Check aria-hidden="true" className="size-3.5 text-brand" />
              )}
              {index + 1}. {item.title}
              {done && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function ProfileWizard({
  profile,
  options,
}: {
  profile: CompanyProfile
  options: OnboardingOptions
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Values for every step live in one form, so Back keeps earlier answers.
  const form = useAuthForm({
    initialValues: profileToValues(profile),
    validate: current.validate,
    fieldIds: PROFILE_FIELD_IDS,
    summaryRef,
  })

  function goToStep(next: number) {
    flushSync(() => {
      form.resetErrors()
      setStep(next)
    })
    headingRef.current?.focus()
  }

  const mutation = useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: (saved) => {
      if (userId) {
        queryClient.setQueryData(companyProfileQueryKey(userId), saved)
        queryClient.setQueryData<Me>(meQueryKey(userId), (prev) =>
          prev ? withSavedProfile(prev, saved) : prev,
        )
        void queryClient.invalidateQueries({ queryKey: meQueryKey(userId) })
        void queryClient.invalidateQueries({
          queryKey: companyProfileQueryKey(userId),
        })
      }
      void navigate("/dashboard", { replace: true })
    },
    onError: (error) => {
      // A server error on an earlier step's field: go back to that step.
      const fields =
        error instanceof ApiError ? Object.keys(error.fieldErrors ?? {}) : []
      const target = STEPS.findIndex((s) =>
        s.fields.some((field) => fields.includes(field)),
      )
      if (target !== -1 && target !== step) flushSync(() => setStep(target))
      form.handleServerError(error)
    },
  })
  const pending = mutation.isPending

  // Continue validates the current step only; the last step saves everything.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    form.handleSubmit((values) => {
      if (pending) return
      if (!isLast) {
        goToStep(step + 1)
        return
      }
      mutation.mutate(valuesToUpdate(values))
    })(event)
  }

  const { Fields } = current

  return (
    <>
      <StepIndicator step={step} />
      <form
        noValidate
        aria-busy={pending}
        className="mt-8 grid gap-6"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-1">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold focus:outline-none"
          >
            <span className="block text-sm font-normal text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            {current.heading}
          </h2>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        <AuthErrorSummary
          ref={summaryRef}
          items={form.summaryItems}
          formError={form.formError}
        />

        <Fields
          values={form.values}
          errors={form.errors}
          setValue={form.setValue}
          onBlur={form.handleBlur}
          options={options}
        />

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={() => goToStep(step - 1)}
            >
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1" disabled={pending}>
            {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
            {pending ? "Saving…" : isLast ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </form>
    </>
  )
}

/**
 * /setup/profile: three-step wizard after /setup/company (inside RequireAuth
 * with `requireProfile={false}`). Saves the whole profile on the last step;
 * finished profiles are edited in /settings instead.
 */
export default function SetupProfilePage() {
  const { data: me } = useMe()
  const profile = useCompanyProfile()
  const options = useOnboardingOptions()
  const signOut = useSignOut()

  // RequireAuth renders this only once /me loaded with a company.
  if (!me?.company) return null
  if (me.company.profile_completed) {
    return <Navigate to="/dashboard" replace />
  }

  if (profile.isPending || options.isPending) {
    return <LoadingScreen label="Loading your company profile…" />
  }
  if (profile.isError || options.isError) {
    return (
      <AccountErrorScreen
        error={profile.error ?? options.error}
        retrying={profile.isFetching || options.isFetching}
        onRetry={() => {
          if (profile.isError) void profile.refetch()
          if (options.isError) void options.refetch()
        }}
      />
    )
  }

  return (
    <>
      <title>Set up your company profile · TenderScout</title>
      <AuthLayout
        title="Tell us about your work"
        subtitle="Three short steps so we only show tenders that fit your business."
        footer={<SignedInFooter me={me} signOut={signOut} />}
      >
        <ProfileWizard profile={profile.data} options={options.data} />
      </AuthLayout>
    </>
  )
}

function SignedInFooter({
  me,
  signOut,
}: {
  me: Me
  signOut: ReturnType<typeof useSignOut>
}) {
  return (
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
  )
}
