import {
  BadgeIndianRupee,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatINR } from "@/lib/format"
import { VerdictRing } from "./VerdictRing"

type Status = "met" | "not-met" | "unclear"

// Status is always shown as icon + text label, never color alone.
const STATUS: Record<
  Status,
  { label: string; icon: LucideIcon; className: string }
> = {
  met: { label: "Met:", icon: CircleCheck, className: "text-success" },
  "not-met": {
    label: "Not met:",
    icon: CircleX,
    className: "text-destructive",
  },
  unclear: {
    label: "Unclear:",
    icon: CircleQuestionMark,
    className: "text-warning",
  },
}

// Fictional demo data.
const CRITERIA: { status: Status; text: string; page: number }[] = [
  { status: "met", text: "Average turnover", page: 12 },
  { status: "met", text: "Similar work experience", page: 14 },
  { status: "not-met", text: "ISO 27001 certification", page: 18 },
  { status: "unclear", text: "OEM authorization", page: 21 },
]

/** Styled, non-interactive citation chip. Clickable chips come with the PDF viewer. */
function CitationChip({ page }: { page: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      <FileText aria-hidden="true" className="size-3" />
      Source p.{page}
    </span>
  )
}

export function VerdictPreviewCard() {
  return (
    <article aria-labelledby="verdict-title" className="w-full">
      <Card className="gap-5 border-border bg-card px-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="brand">Sample report</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            RJPOL/2026/CCTV/0417
          </span>
        </div>

        <h2 id="verdict-title" className="text-lg font-semibold text-balance">
          Supply, Installation and Commissioning of 120 CCTV Cameras
        </h2>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Department</dt>
            <dd className="font-medium">Rajasthan Police</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Estimated value</dt>
            <dd className="font-mono font-medium">{formatINR(4800000)}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-4 rounded-lg border bg-surface-2 p-4">
          <VerdictRing met={7} total={9} />
          <p className="text-sm">
            <span className="mb-1 flex items-center gap-1.5 text-base font-semibold">
              <CircleCheck aria-hidden="true" className="size-5 text-success" />
              Recommended: Bid.
            </span>
            <span className="text-muted-foreground">
              You meet 7 of 9 conditions.
            </span>
          </p>
        </div>

        <ul aria-label="Key conditions" className="flex flex-col divide-y">
          {CRITERIA.map((item) => {
            const s = STATUS[item.status]
            const Icon = s.icon
            return (
              <li
                key={item.text}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="flex items-start gap-2">
                  <Icon
                    aria-hidden="true"
                    className={`mt-0.5 size-4 shrink-0 ${s.className}`}
                  />
                  <span>
                    <span className="font-medium">{s.label}</span> {item.text}
                  </span>
                </span>
                <CitationChip page={item.page} />
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-between gap-3 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-soft-foreground">
          <span className="flex items-start gap-2">
            <BadgeIndianRupee
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              <span className="font-medium">Your benefit:</span> EMD of{" "}
              <span className="font-mono">{formatINR(200000)}</span> waived
              (registered MSE)
            </span>
          </span>
          <CitationChip page={9} />
        </div>

        <p className="text-xs text-muted-foreground">
          Illustrative example with fictional data.
        </p>
      </Card>
    </article>
  )
}
