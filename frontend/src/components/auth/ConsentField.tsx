import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FieldError } from "./FieldError"
import { TextLink } from "./TextLink"

/** "I agree to the Terms and Privacy Policy" checkbox with its inline error. */
export function ConsentField({
  id,
  checked,
  error,
  onCheckedChange,
  onBlur,
}: {
  id: string
  checked: boolean
  error?: string
  onCheckedChange: (checked: boolean) => void
  onBlur: () => void
}) {
  const errorId = `${id}-error`
  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          name="consent"
          required
          className="mt-0.5 size-5"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <Label htmlFor={id} className="block leading-snug font-normal">
          I agree to the <TextLink to="/terms">Terms</TextLink> and{" "}
          <TextLink to="/privacy">Privacy Policy</TextLink>
        </Label>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
