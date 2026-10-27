import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useMe } from "@/hooks/useMe"
import { cn } from "@/lib/utils"
import { Building2, Menu } from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet } from "react-router"
import { APP_NAV_ITEMS } from "./app-nav-items"
import { Logo } from "./Logo"
import { SkipToContent } from "./SkipToContent"
import { UserMenu } from "./UserMenu"

/**
 * Nav links. The active link gets aria-current="page" (NavLink) and is marked
 * by an inset bar and bold text, not by color alone.
 */
function AppNav({
  label,
  inSheet = false,
}: {
  label: string
  inSheet?: boolean
}) {
  return (
    <nav aria-label={label}>
      <ul className="grid gap-1">
        {APP_NAV_ITEMS.map(({ to, label: itemLabel, icon: Icon }) => {
          const link = (
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-brand-soft font-semibold text-foreground shadow-[inset_3px_0_0_var(--brand)]"
                    : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className={cn("size-4 shrink-0", isActive && "text-brand")}
                  />
                  {itemLabel}
                </>
              )}
            </NavLink>
          )
          return (
            <li key={to}>
              {inSheet ? <SheetClose asChild>{link}</SheetClose> : link}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Layout of the logged-in app (inside RequireAuth): sidebar from lg up,
 * a hamburger + Sheet below lg, top bar with company name and user menu.
 */
export function AppShell() {
  const { data: me } = useMe()
  const [navOpen, setNavOpen] = useState(false)

  // RequireAuth only renders this once /me loaded with a company.
  if (!me?.company) return null

  return (
    <>
      <SkipToContent />

      <div className="hidden border-r bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Logo to="/dashboard" label="TenderScout dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AppNav label="Main" />
        </div>
      </div>

      <div className="flex min-h-svh flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu aria-hidden="true" className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Go to a section of TenderScout
                  </SheetDescription>
                  <SheetClose asChild>
                    <Logo
                      to="/dashboard"
                      label="TenderScout dashboard"
                      className="self-start"
                    />
                  </SheetClose>
                </SheetHeader>
                <div className="px-3">
                  <AppNav label="Main" inSheet />
                </div>
              </SheetContent>
            </Sheet>

            <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <Building2
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="sr-only">Company: </span>
              <span className="truncate">{me.company.name}</span>
            </p>

            <div className="ml-auto shrink-0">
              <UserMenu me={me} />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </>
  )
}
