import { Link } from "react-router"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="TenderScout home"
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
