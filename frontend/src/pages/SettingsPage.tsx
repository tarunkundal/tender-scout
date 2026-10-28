import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary"
import {
  BusinessFields,
  CompanyContactFields,
  ExperienceFields,
  WorkFields,
} from "@/components/profile/ProfileFields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuthForm } from "@/hooks/useAuthForm"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { useOnboardingOptions } from "@/hooks/useOnboardingOptions"
import { useSession } from "@/hooks/useSession"
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
import { validateProfile } from "@/lib/validation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleAlert, CircleCheck, Loader2, KeyRound } from "lucide-react"
import { useRef, useState } from "react"

function CompanyProfileForm({
  profile,
  options,
}: {
  profile: CompanyProfile
  options: OnboardingOptions
}) {
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id
  const summaryRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState(false)
  const form = useAuthForm({
    initialValues: profileToValues(profile),
    validate: validateProfile,
    fieldIds: PROFILE_FIELD_IDS,
    summaryRef,
  })

  const mutation = useMutation({
    mutationFn: updateCompanyProfile,
    onSuccess: (next) => {
      if (userId) {
        queryClient.setQueryData(companyProfileQueryKey(userId), next)
        queryClient.setQueryData<Me>(meQueryKey(userId), (prev) =>
          prev ? withSavedProfile(prev, next) : prev,
        )
        void queryClient.invalidateQueries({ queryKey: meQueryKey(userId) })
      }
      setSaved(true)
    },
    onError: (error) => form.handleServerError(error),
  })
  const pending = mutation.isPending

  // Any edit after a save hides the "Saved" message until the next save.
  function setValue<K extends keyof typeof form.values>(
    key: K,
    value: (typeof form.values)[K],
  ) {
    setSaved(false)
    form.setValue(key, value)
  }

  const fieldProps = {
    values: form.values,
    errors: form.errors,
    setValue,
    onBlur: form.handleBlur,
    options,
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      className="grid gap-6"
      onSubmit={form.handleSubmit((values) => {
        if (pending) return
        setSaved(false)
        mutation.mutate(valuesToUpdate(values))
      })}
    >
      <AuthErrorSummary
        ref={summaryRef}
        items={form.summaryItems}
        formError={form.formError}
      />
      <CompanyContactFields {...fieldProps} />
      <BusinessFields {...fieldProps} />
      <WorkFields {...fieldProps} />
      <ExperienceFields {...fieldProps} />

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {/* Always rendered so the polite announcement is reliable. */}
        <p role="status" className="text-sm">
          {saved && (
            <span className="flex items-center gap-2">
              <CircleCheck
                aria-hidden="true"
                className="size-4 shrink-0 text-success"
              />
              Company profile saved.
            </span>
          )}
        </p>
      </div>
    </form>
  )
}

function ProfileCardContent() {
  const profile = useCompanyProfile()
  const options = useOnboardingOptions()

  if (profile.isPending || options.isPending) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-muted-foreground"
      >
        <Loader2
          aria-hidden="true"
          className="size-4 animate-spin text-brand"
        />
        Loading your company profile…
      </p>
    )
  }
  if (profile.isError || options.isError) {
    const error = profile.error ?? options.error
    return (
      <div className="grid justify-items-start gap-3">
        <p className="flex items-start gap-2">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          {error instanceof ApiError
            ? error.message
            : "We couldn't load your company profile."}
        </p>
        <Button
          variant="outline"
          disabled={profile.isFetching || options.isFetching}
          onClick={() => {
            if (profile.isError) void profile.refetch()
            if (options.isError) void options.refetch()
          }}
        >
          Try again
        </Button>
      </div>
    )
  }
  return <CompanyProfileForm profile={profile.data} options={options.data} />
}

/** /settings: company profile form plus read-only account details. */
export default function SettingsPage() {
  const user = useSession().data?.user

  return (
    <>
      <title>Settings · TenderScout</title>
      <div className="grid gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Keep your company profile up to date. We use it to match tenders.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2
              id="settings-company-heading"
              className="text-lg leading-none font-semibold"
            >
              Company profile
            </h2>
          </CardHeader>
          <CardContent className="max-w-2xl">
            <ProfileCardContent />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2
              id="settings-account-heading"
              className="text-lg leading-none font-semibold"
            >
              Account
            </h2>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-1">
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="break-words">
                  {user?.name?.trim() || "Not set"}
                </dd>
              </div>
              <div className="grid min-w-0 gap-1">
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="break-all">{user?.email}</dd>
              </div>
            </dl>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <KeyRound
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
              />
              Sign-in &amp; security is managed by Neon Auth.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
