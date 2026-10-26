import type { ErrorSummaryItem } from "@/hooks/useAuthForm"
import { CircleAlert } from "lucide-react"
import type { MouseEvent, Ref } from "react"

/** Moves focus to the field itself (a plain #hash jump does not focus inputs everywhere). */
function focusField(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const field = document.getElementById(id)
  if (!field) return
  event.preventDefault()
  field.focus()
}

/**
 * Error summary shown at the top of a form after a failed submit.
 * The form hook focuses it, so screen readers read it without role="alert".
 */
export function AuthErrorSummary({
  ref,
  items,
  formError,
}: {
  ref: Ref<HTMLDivElement>
  items: ErrorSummaryItem[]
  formError: string | null
}) {
  if (!formError && items.length === 0) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="rounded-lg border border-destructive/60 bg-destructive/10 p-4 focus:outline-none"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <CircleAlert aria-hidden="true" className="size-4 text-destructive" />
        Please fix the following
      </h2>
      <ul className="mt-2 grid gap-1.5 pl-6 text-sm">
        {formError && <li>{formError}</li>}
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(event) => focusField(event, item.id)}
              className="rounded-sm text-destructive underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
