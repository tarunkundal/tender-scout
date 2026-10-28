import { FieldError } from "@/components/auth/FieldError"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ReactNode } from "react"
import type { ChoiceOption } from "./RadioCardGroup"

/**
 * Multiple choice as checkbox cards in a `fieldset` + `legend`. The whole
 * card toggles its checkbox (the label covers it). The first checkbox gets
 * `id` for the error summary. `onChange` returns the selection in option
 * order, so saved lists are stable.
 */
export function CheckboxCardGroup<T extends string>({
  id,
  legend,
  hint,
  options,
  value,
  onChange,
  onBlur,
  error,
}: {
  id: string
  legend: ReactNode
  hint?: string
  options: readonly ChoiceOption<T>[]
  value: readonly string[]
  onChange: (value: T[]) => void
  onBlur?: () => void
  error?: string
}) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const groupDescribedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(" ")
  const selected = new Set(value)

  function toggle(optionValue: T, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(optionValue)
    else next.delete(optionValue)
    onChange(options.map((o) => o.value).filter((v) => next.has(v)))
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm leading-snug font-medium">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => {
          const inputId = index === 0 ? id : `${id}-${option.value}`
          const optionHintId = option.hint ? `${inputId}-hint` : ""
          const describedBy =
            [optionHintId, groupDescribedBy].filter(Boolean).join(" ") ||
            undefined
          return (
            <li
              key={option.value}
              className="relative flex items-start gap-3 rounded-lg border border-muted-foreground/40 p-3 transition-colors hover:bg-accent has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft"
            >
              <Checkbox
                id={inputId}
                className="mt-0.5"
                checked={selected.has(option.value)}
                onCheckedChange={(checked) =>
                  toggle(option.value, checked === true)
                }
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
              />
              <div className="grid min-w-0 gap-0.5">
                {/* after: stretches the label over the card, so the card is the click target. */}
                <Label
                  htmlFor={inputId}
                  className="block cursor-pointer leading-snug break-words after:absolute after:inset-0 after:content-['']"
                >
                  {option.label}
                </Label>
                {option.hint && (
                  <p
                    id={optionHintId}
                    className="text-sm text-muted-foreground"
                  >
                    {option.hint}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {error && (
        <div className="mt-2">
          <FieldError id={errorId} message={error} />
        </div>
      )}
    </fieldset>
  )
}
