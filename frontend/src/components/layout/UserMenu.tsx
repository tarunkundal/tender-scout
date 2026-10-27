import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSignOut } from "@/hooks/useSignOut"
import type { Me } from "@/lib/api"
import { ChevronDown, Loader2, LogOut } from "lucide-react"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts.at(-1)] : parts
  return letters.map((part) => part?.[0]?.toUpperCase() ?? "").join("")
}

/** Top bar account menu: name, email and "Log out". */
export function UserMenu({ me }: { me: Me }) {
  const signOut = useSignOut()
  const { email } = me.user
  const name = me.user.name?.trim() || email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2"
          disabled={signOut.isPending}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-soft-foreground"
          >
            {signOut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              initials(name)
            )}
          </span>
          <span className="sr-only sm:not-sr-only sm:max-w-40 sm:truncate">
            {name}
          </span>
          <span className="sr-only">, account menu</span>
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">{name}</span>
          <span className="font-normal break-all text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut.mutate()}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
