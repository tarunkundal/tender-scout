import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card"
import { useCompanyProfile } from "@/hooks/useCompanyProfile"
import { useOnboardingOptions } from "@/hooks/useOnboardingOptions"
import { ApiError } from "@/lib/api"
import { CircleAlert, Loader2, Pencil, Sprout } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

/** States shown as badges before "+N more". */
const MAX_STATE_BADGES = 6

function labelsOf(options: readonly { value: string; label: string }[]) {
  return new Map(options.map((o) => [o.value, o.label]))
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

/** Dashboard card: the saved company profile with an "Edit" link to /settings. */
export function CompanyProfileSummary() {
  const profile = useCompanyProfile()
  const options = useOnboardingOptions()

  let body: ReactNode
  if (profile.isPending || options.isPending) {
    body = (
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
  } else if (profile.isError || options.isError) {
    const error = profile.error ?? options.error
    body = (
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
          size="sm"
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
  } else {
    const p = profile.data
    const entityLabels = labelsOf(options.data.entity_types)
    const stateLabels = labelsOf(options.data.states)
    const workLabels = labelsOf(options.data.work_types)
    const authorityLabels = labelsOf(options.data.registration_authorities)
    const shownStates = p.states.slice(0, MAX_STATE_BADGES)
    const hiddenStates = p.states.slice(MAX_STATE_BADGES)
    const authority = p.registration_authority

    body = (
      <div className="grid gap-5">
        {p.beginner && (
          <Badge variant="brand" className="text-sm">
            <Sprout aria-hidden="true" />
            Beginner mode
          </Badge>
        )}
        <dl className="grid gap-5 sm:grid-cols-2">
          <Row term="Business type">
            {p.entity_type ? entityLabels.get(p.entity_type) : "Not set"}
          </Row>
          <Row term="Registration">
            {!authority
              ? "Not set"
              : authority === "none"
                ? authorityLabels.get(authority)
                : [authorityLabels.get(authority), p.registration_class]
                    .filter(Boolean)
                    .join(", ")}
          </Row>
          <Row term={`States (${p.states.length})`}>
            <ul className="flex flex-wrap gap-1.5">
              {shownStates.map((code) => (
                <li key={code}>
                  <Badge variant="outline">{stateLabels.get(code)}</Badge>
                </li>
              ))}
              {hiddenStates.length > 0 && (
                <li>
                  <Badge variant="secondary">
                    +{hiddenStates.length} more
                    <span className="sr-only">
                      :{" "}
                      {hiddenStates
                        .map((code) => stateLabels.get(code))
                        .join(", ")}
                    </span>
                  </Badge>
                </li>
              )}
            </ul>
          </Row>
          <Row term="Types of work">
            <ul className="flex flex-wrap gap-1.5">
              {p.work_types.map((code) => (
                <li key={code}>
                  <Badge variant="outline">{workLabels.get(code)}</Badge>
                </li>
              ))}
            </ul>
          </Row>
        </dl>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg leading-none font-semibold">Company profile</h2>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">
              <Pencil aria-hidden="true" />
              Edit<span className="sr-only"> company profile</span>
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
