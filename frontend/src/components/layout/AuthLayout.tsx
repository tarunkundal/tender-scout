import { BadgePercent, FileSearch, Sunrise } from "lucide-react"
import type { ReactNode, Ref } from "react"
import { Logo } from "./Logo"
import { SkipToContent } from "./SkipToContent"

const VALUE_POINTS = [
  { icon: Sunrise, text: "Matched civil works tenders every morning" },
  {
    icon: FileSearch,
    text: "Eligibility checked with proof from the tender page",
  },
  { icon: BadgePercent, text: "MSME benefits like EMD exemption flagged" },
]

/**
 * Layout for /login and /signup: form column on the left, brand panel on the
 * right from lg up; form only on smaller screens. No marketing header.
 */
export function AuthLayout({
  title,
  subtitle,
  headingRef,
  footer,
  children,
}: {
  title: string
  subtitle: ReactNode
  /** Lets a page move focus to the h1 (e.g. after signup succeeds). */
  headingRef?: Ref<HTMLHeadingElement>
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <SkipToContent />
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-svh focus:outline-none lg:grid-cols-2"
      >
        <div className="flex flex-col px-4 py-8 sm:px-6 lg:px-12">
          <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
            <Logo className="self-start" />
            <div className="flex flex-1 flex-col justify-center py-10">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight focus:outline-none sm:text-3xl"
              >
                {title}
              </h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
              <div className="mt-8">{children}</div>
              {footer && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  {footer}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Brand panel: decorative, inside <main> so it adds no landmarks. */}
        <div className="hidden border-l bg-card bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.15),transparent_60%)] lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="text-2xl font-semibold tracking-tight text-balance">
              Find the government tenders your business can win.
            </p>
            <ul className="mt-8 grid gap-5">
              {VALUE_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="text-base">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}
