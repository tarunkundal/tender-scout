import {
  FileSearch,
  FolderOpen,
  LayoutDashboard,
  Settings,
  SquareKanban,
  type LucideIcon,
} from "lucide-react"

/** Sidebar navigation of the logged-in app (AppShell). */
export const APP_NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] =
  [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tenders", label: "Tenders", icon: FileSearch },
    { to: "/documents", label: "Documents", icon: FolderOpen },
    { to: "/pipeline", label: "Pipeline", icon: SquareKanban },
    { to: "/settings", label: "Settings", icon: Settings },
  ]
