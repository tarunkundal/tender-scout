import { ApiError } from "@/lib/api"
import { hasErrors, type FieldErrors } from "@/lib/validation"
import { useState, type FormEvent, type RefObject } from "react"
import { flushSync } from "react-dom"

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

export interface ErrorSummaryItem {
  /** id of the invalid input; the summary links to it. */
  id: string
  message: string
}

/**
 * Plain controlled-form state for the auth screens.
 * - Validates on submit; after the first submit attempt, re-validates a field on blur.
 * - On a failed submit (client or server), shows the error summary and moves focus to it.
 */
export function useAuthForm<V extends object>({
  initialValues,
  validate,
  fieldIds,
  summaryRef,
}: {
  initialValues: V
  validate: (values: V) => FieldErrors<Extract<keyof V, string>>
  /** Input id per field, in on-screen order (used for summary links). */
  fieldIds: Record<Extract<keyof V, string>, string>
  /** Ref attached to the error summary; focused after a failed submit. */
  summaryRef: RefObject<HTMLDivElement | null>
}) {
  type Key = Extract<keyof V, string>

  const [values, setValues] = useState<V>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)

  function setValue<K extends Key>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleBlur(key: Key) {
    if (!attempted) return
    const message = validate(values)[key]
    setErrors((prev) => ({ ...prev, [key]: message }))
  }

  function showErrors(
    nextErrors: FieldErrors<Key>,
    nextFormError: string | null,
  ) {
    // Render the summary synchronously so it exists before we focus it.
    flushSync(() => {
      setErrors(nextErrors)
      setFormError(nextFormError)
    })
    summaryRef.current?.focus()
  }

  function handleSubmit(onValid: (values: V) => void) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setAttempted(true)
      const nextErrors = validate(values)
      if (hasErrors(nextErrors)) {
        showErrors(nextErrors, null)
        return
      }
      setErrors({})
      setFormError(null)
      onValid(values)
    }
  }

  /** Maps an ApiError onto fields (fieldErrors) or the summary (message). */
  function handleServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      showErrors({}, FALLBACK_MESSAGE)
      return
    }
    const fieldErrors: FieldErrors<Key> = {}
    for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
      if (field in fieldIds) fieldErrors[field as Key] = message
    }
    if (hasErrors(fieldErrors)) showErrors(fieldErrors, null)
    else showErrors({}, error.message || FALLBACK_MESSAGE)
  }

  /** Clears errors and the "attempted" flag (e.g. when a wizard changes step). */
  function resetErrors() {
    setErrors({})
    setFormError(null)
    setAttempted(false)
  }

  const summaryItems: ErrorSummaryItem[] = (
    Object.entries(fieldIds) as [Key, string][]
  ).flatMap(([key, id]) => {
    const message = errors[key]
    return message ? [{ id, message }] : []
  })

  return {
    values,
    errors,
    formError,
    summaryItems,
    setValue,
    handleBlur,
    handleSubmit,
    handleServerError,
    showErrors,
    resetErrors,
  }
}
