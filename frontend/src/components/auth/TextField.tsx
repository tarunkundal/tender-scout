import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ComponentProps } from "react"
import { FieldError } from "./FieldError"

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string
  label: string
  error?: string
  hint?: string
  /** Shows "(optional)" after the label. */
  optional?: boolean
}

export function TextField({
  id,
  label,
  error,
  hint,
  optional = false,
  ...inputProps
}: TextFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  )
}
