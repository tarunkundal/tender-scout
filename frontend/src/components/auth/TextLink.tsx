import { cn } from "@/lib/utils"
import { Link, type LinkProps } from "react-router"

/**
 * Brand-orange text link. A faint underline is always shown so links inside
 * muted text are not marked by color alone; it strengthens on hover.
 */
export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "rounded-sm font-medium text-brand underline decoration-brand/40 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  )
}
