import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useState, type ComponentProps, type ReactNode } from "react"
import { FieldError } from "./FieldError"

type PasswordFieldProps = Omit<ComponentProps<"input">, "id" | "type"> & {
  id: string
  label: string
  error?: string
  /** Extra ids for aria-describedby (e.g. the password rule hints). */
  describedBy?: string
  /** Rendered under the input (e.g. rule hints). */
  children?: ReactNode
}

export function PasswordField({
  id,
  label,
  error,
  describedBy,
  children,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`
  const ariaDescribedBy =
    [error && errorId, describedBy].filter(Boolean).join(" ") || undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-11"
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          {...inputProps}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      <FieldError id={errorId} message={error} />
      {children}
    </div>
  )
}
