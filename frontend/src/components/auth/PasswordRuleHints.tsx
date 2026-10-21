import { PASSWORD_RULES } from "@/lib/validation"
import { cn } from "@/lib/utils"
import { Circle, CircleCheck } from "lucide-react"

/**
 * Live password rules. State is shown by icon shape (circle vs check) and
 * screen-reader text, not by color alone. Changes are announced politely.
 */
export function PasswordRuleHints({
  id,
  password,
}: {
  id: string
  password: string
}) {
  const rules = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }))
  const unmet = rules.filter((rule) => !rule.met)

  let announcement = ""
  if (password) {
    announcement =
      unmet.length === 0
        ? "All password rules met."
        : `${rules.length - unmet.length} of ${rules.length} password rules met. Still needed: ${unmet
            .map((rule) => rule.label.toLowerCase())
            .join(", ")}.`
  }

  return (
    <div>
      <ul id={id} className="grid gap-1.5 text-sm">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2",
              rule.met ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {rule.met ? (
              <CircleCheck
                aria-hidden="true"
                className="size-4 shrink-0 text-success"
              />
            ) : (
              <Circle aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span>
              <span className="sr-only">
                {rule.met ? "Met: " : "Not met: "}
              </span>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
