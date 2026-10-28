import { FieldError } from "@/components/auth/FieldError"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { useState } from "react"
import type { ChoiceOption } from "./RadioCardGroup"

/**
 * Searchable multi-select for states and union territories: a filter input
 * above a scrollable checkbox list, with the selected count announced
 * politely. The filter input carries `id` (error summary target). Filtering
 * only hides rows; hidden selections stay selected.
 */
export function StatesField<T extends string>({
  id,
  options,
  value,
  onChange,
  onBlur,
  error,
}: {
  id: string
  options: readonly ChoiceOption<T>[]
  value: readonly string[]
  onChange: (value: T[]) => void
  onBlur?: () => void
  error?: string
}) {
  const [query, setQuery] = useState("")
  const hintId = `${id}-hint`
  const countId = `${id}-count`
  const errorId = `${id}-error`
  const listId = `${id}-list`
  const describedBy = [hintId, countId, error && errorId]
    .filter(Boolean)
    .join(" ")
  const selected = new Set(value)
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(needle) ||
          o.value.toLowerCase() === needle,
      )
    : options

  function toggle(optionValue: T, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(optionValue)
    else next.delete(optionValue)
    onChange(options.map((o) => o.value).filter((v) => next.has(v)))
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm leading-snug font-medium">
        States and union territories where you work
      </legend>
      <p id={hintId} className="mt-1 text-sm text-muted-foreground">
        We use these to pick tenders in your area. Choose one or more.
      </p>

      <div className="mt-3 grid gap-2">
        <Label htmlFor={id} className="sr-only">
          Search states
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={id}
            type="search"
            placeholder="Search states"
            autoComplete="off"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // Enter filters; it must not submit the surrounding form.
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault()
            }}
            aria-controls={listId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <p
          id={countId}
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {selected.size === 1 ? "1 selected" : `${selected.size} selected`}
        </p>

        <div
          id={listId}
          className="max-h-72 overflow-y-auto rounded-lg border border-muted-foreground/40 p-1"
        >
          {visible.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No state matches “{query.trim()}”.
            </p>
          ) : (
            <ul className="grid sm:grid-cols-2">
              {visible.map((option) => {
                const inputId = `${id}-${option.value}`
                return (
                  <li
                    key={option.value}
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      id={inputId}
                      checked={selected.has(option.value)}
                      onCheckedChange={(checked) =>
                        toggle(option.value, checked === true)
                      }
                      onBlur={onBlur}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
                    />
                    <Label
                      htmlFor={inputId}
                      className="block min-w-0 flex-1 cursor-pointer py-0.5 leading-snug font-normal break-words"
                    >
                      {option.label}
                    </Label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2">
          <FieldError id={errorId} message={error} />
        </div>
      )}
    </fieldset>
  )
}
