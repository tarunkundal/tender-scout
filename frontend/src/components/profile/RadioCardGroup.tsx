import { FieldError } from "@/components/auth/FieldError"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  hint?: string
}

/**
 * Single choice as native radios in a `fieldset` + `legend`, each option a
 * clickable card. The first radio gets `id`, so the error summary can focus
 * the group; arrow keys move between options (native radio behaviour).
 * Selection shows as the filled radio plus a brand border, not color alone.
 */
export function RadioCardGroup<T extends string>({
  id,
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  onBlur,
  error,
  columns = 2,
}: {
  id: string
  name: string
  legend: ReactNode
  hint?: string
  options: readonly ChoiceOption<T>[]
  value: string
  onChange: (value: T) => void
  onBlur?: () => void
  error?: string
  /** Columns from `sm` up (always one column on small screens). */
  columns?: 1 | 2
}) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const groupDescribedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(" ")

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm leading-snug font-medium">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <div className={cn("mt-3 grid gap-2", columns === 2 && "sm:grid-cols-2")}>
        {options.map((option, index) => {
          const inputId = index === 0 ? id : `${id}-${option.value}`
          const optionHintId = option.hint ? `${inputId}-hint` : ""
          const describedBy =
            [optionHintId, groupDescribedBy].filter(Boolean).join(" ") ||
            undefined
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-muted-foreground/40 p-3 transition-colors hover:bg-accent has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background"
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className="mt-0.5 size-4 shrink-0 accent-primary outline-none focus-visible:outline-none"
              />
              <span className="grid min-w-0 gap-0.5">
                <span className="text-sm font-medium break-words">
                  {option.label}
                </span>
                {option.hint && (
                  <span
                    id={optionHintId}
                    className="text-sm text-muted-foreground"
                  >
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <div className="mt-2">
          <FieldError id={errorId} message={error} />
        </div>
      )}
    </fieldset>
  )
}
