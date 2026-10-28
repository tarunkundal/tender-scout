import { TextField } from "@/components/auth/TextField"
import type { OnboardingOptions } from "@/lib/api"
import { PROFILE_FIELD_IDS as IDS } from "@/lib/profile"
import type { ProfileErrors, ProfileValues } from "@/lib/validation"
import { Sprout } from "lucide-react"
import { CheckboxCardGroup } from "./CheckboxCardGroup"
import { RadioCardGroup } from "./RadioCardGroup"
import { StatesField } from "./StatesField"

/**
 * Company profile field groups, shared by the /setup/profile wizard (one
 * group per step) and the Settings form (all groups).
 */
export interface ProfileFieldsProps {
  values: ProfileValues
  errors: ProfileErrors
  setValue: <K extends keyof ProfileValues>(
    key: K,
    value: ProfileValues[K],
  ) => void
  onBlur: (key: keyof ProfileValues) => void
  options: OnboardingOptions
}

const BID_BEFORE_OPTIONS = [
  { value: "yes", label: "Yes, we have bid before" },
  { value: "no", label: "No, this will be our first bid" },
] as const

/** Company name and mobile (Settings only; the wizard keeps the saved ones). */
export function CompanyContactFields({
  values,
  errors,
  setValue,
  onBlur,
}: ProfileFieldsProps) {
  return (
    <>
      <TextField
        id={IDS.name}
        name="name"
        label="Company name"
        autoComplete="organization"
        required
        maxLength={200}
        value={values.name}
        onChange={(e) => setValue("name", e.target.value)}
        onBlur={() => onBlur("name")}
        error={errors.name}
      />
      <TextField
        id={IDS.mobile}
        name="mobile"
        type="tel"
        inputMode="numeric"
        label="Mobile number"
        optional
        hint="10-digit Indian mobile number, without +91."
        autoComplete="tel"
        value={values.mobile}
        onChange={(e) => setValue("mobile", e.target.value)}
        onBlur={() => onBlur("mobile")}
        error={errors.mobile}
      />
    </>
  )
}

/** Step 1: entity type and states. */
export function BusinessFields({
  values,
  errors,
  setValue,
  onBlur,
  options,
}: ProfileFieldsProps) {
  return (
    <>
      <RadioCardGroup
        id={IDS.entityType}
        name="entityType"
        legend="Business type"
        hint="As registered for GST and PAN."
        options={options.entity_types}
        value={values.entityType}
        onChange={(value) => setValue("entityType", value)}
        onBlur={() => onBlur("entityType")}
        error={errors.entityType}
      />
      <StatesField
        id={IDS.states}
        options={options.states}
        value={values.states}
        onChange={(value) => setValue("states", value)}
        onBlur={() => onBlur("states")}
        error={errors.states}
      />
    </>
  )
}

/** Step 2: work types, registration authority and class. */
export function WorkFields({
  values,
  errors,
  setValue,
  onBlur,
  options,
}: ProfileFieldsProps) {
  const showClass =
    values.registrationAuthority !== "" &&
    values.registrationAuthority !== "none"
  return (
    <>
      <CheckboxCardGroup
        id={IDS.workTypes}
        legend="Types of work you do"
        hint="Choose all that apply."
        options={options.work_types}
        value={values.workTypes}
        onChange={(value) => setValue("workTypes", value)}
        onBlur={() => onBlur("workTypes")}
        error={errors.workTypes}
      />
      <RadioCardGroup
        id={IDS.registrationAuthority}
        name="registrationAuthority"
        legend="Contractor registration"
        hint="The department you are enlisted or registered with."
        options={options.registration_authorities}
        value={values.registrationAuthority}
        onChange={(value) => setValue("registrationAuthority", value)}
        onBlur={() => onBlur("registrationAuthority")}
        error={errors.registrationAuthority}
      />
      {showClass && (
        <TextField
          id={IDS.registrationClass}
          name="registrationClass"
          label="Registration class"
          optional
          hint="e.g. Class IV"
          maxLength={50}
          autoComplete="off"
          value={values.registrationClass}
          onChange={(e) => setValue("registrationClass", e.target.value)}
          onBlur={() => onBlur("registrationClass")}
          error={errors.registrationClass}
        />
      )}
    </>
  )
}

/** Step 3: bid experience, with the beginner note for "No". */
export function ExperienceFields({
  values,
  errors,
  setValue,
  onBlur,
}: ProfileFieldsProps) {
  return (
    <>
      <RadioCardGroup
        id={IDS.hasBidBefore}
        name="hasBidBefore"
        legend="Have you bid on a government tender before?"
        options={BID_BEFORE_OPTIONS}
        value={values.hasBidBefore}
        onChange={(value) => setValue("hasBidBefore", value)}
        onBlur={() => onBlur("hasBidBefore")}
        error={errors.hasBidBefore}
        columns={1}
      />
      <div aria-live="polite">
        {values.hasBidBefore === "no" && (
          <div className="flex items-start gap-3 rounded-lg border border-brand/40 bg-brand-soft p-4 text-sm">
            <Sprout
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-brand"
            />
            <p>
              <span className="font-semibold">
                That's fine, everyone starts somewhere.
              </span>{" "}
              We'll switch on beginner mode. It will show a readiness checklist
              of the documents and registrations you need, plus starter guidance
              for your first bid.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
