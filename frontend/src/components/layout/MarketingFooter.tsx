import { Link } from "react-router"
import { Logo } from "./Logo"
import { NAV_ITEMS } from "./nav-items"

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={linkClass}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className={linkClass}>
                  Log in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>© 2026 TenderScout. All rights reserved.</p>
          <p>
            TenderScout is decision support. Always verify with the official
            tender document.
          </p>
        </div>
      </div>
    </footer>
  )
}
