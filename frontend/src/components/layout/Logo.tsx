import { cn } from "@/lib/utils"
import { Link } from "react-router"

export function Logo({
  className,
  to = "/",
  label = "TenderScout home",
}: {
  className?: string
  /** Link target; the app shell points it at /dashboard. */
  to?: string
  /** Accessible name of the link. */
  label?: string
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-6 shrink-0"
        focusable="false"
      >
        <rect
          x="7"
          y="7"
          width="18"
          height="18"
          rx="3"
          transform="rotate(45 16 16)"
          fill="var(--brand)"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">TenderScout</span>
    </Link>
  )
}
