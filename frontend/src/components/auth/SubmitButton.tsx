import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean
  label: string
  pendingLabel: string
}) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 aria-hidden="true" className="animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}
