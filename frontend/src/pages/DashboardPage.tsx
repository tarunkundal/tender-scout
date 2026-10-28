import { CompanyProfileSummary } from "@/components/profile/CompanyProfileSummary"
import { Card, CardContent } from "@/components/ui/card"
import { useMe } from "@/hooks/useMe"
import { Building2, Inbox } from "lucide-react"

function firstName(name: string | null, email: string) {
  const first = name?.trim().split(/\s+/)[0]
  return first || email.split("@")[0]
}

export default function DashboardPage() {
  const { data: me } = useMe()
  // RequireAuth renders this only once /me loaded with a company.
  if (!me?.company) return null

  return (
    <>
      <title>Dashboard · TenderScout</title>
      <div className="grid gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
            Welcome, {firstName(me.user.name, me.user.email)}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Building2 aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 break-words">{me.company.name}</span>
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Inbox aria-hidden="true" className="size-6" />
            </span>
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold">
                Your matched tenders will appear here.
              </h2>
              <p className="text-muted-foreground">
                We'll match them against your company profile below.
              </p>
            </div>
          </CardContent>
        </Card>

        <CompanyProfileSummary />
      </div>
    </>
  )
}
