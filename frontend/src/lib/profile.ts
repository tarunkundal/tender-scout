import type {
  CompanyProfile,
  CompanyProfileUpdate,
  EntityType,
  Me,
  RegistrationAuthority,
  StateCode,
  WorkType,
} from "@/lib/api"
import { normalizeMobile, type ProfileValues } from "@/lib/validation"

/** Input ids per profile field, in on-screen order (error summary links). */
export const PROFILE_FIELD_IDS = {
  name: "profile-name",
  mobile: "profile-mobile",
  entityType: "profile-entity-type",
  states: "profile-states",
  workTypes: "profile-work-types",
  registrationAuthority: "profile-registration-authority",
  registrationClass: "profile-registration-class",
  hasBidBefore: "profile-has-bid-before",
} as const satisfies Record<keyof ProfileValues, string>

export function profileToValues(profile: CompanyProfile): ProfileValues {
  return {
    name: profile.name,
    mobile: profile.contact_mobile ?? "",
    entityType: profile.entity_type ?? "",
    states: [...profile.states],
    workTypes: [...profile.work_types],
    registrationAuthority: profile.registration_authority ?? "",
    registrationClass: profile.registration_class ?? "",
    hasBidBefore:
      profile.has_bid_before === null
        ? ""
        : profile.has_bid_before
          ? "yes"
          : "no",
  }
}

/**
 * Request body for `PUT /company/profile`. Call only after validation
 * passed: every choice is then one of the option values from the API.
 */
export function valuesToUpdate(values: ProfileValues): CompanyProfileUpdate {
  const authority = values.registrationAuthority as RegistrationAuthority
  const registrationClass = values.registrationClass.trim()
  return {
    name: values.name.trim(),
    contact_mobile: normalizeMobile(values.mobile) || null,
    entity_type: values.entityType as EntityType,
    states: values.states as StateCode[],
    work_types: values.workTypes as WorkType[],
    registration_authority: authority,
    registration_class:
      authority === "none" || !registrationClass ? null : registrationClass,
    has_bid_before: values.hasBidBefore === "yes",
  }
}

/** `GET /me` with the company fields a profile save can change. */
export function withSavedProfile(me: Me, profile: CompanyProfile): Me {
  if (!me.company) return me
  return {
    ...me,
    company: {
      ...me.company,
      name: profile.name,
      contact_mobile: profile.contact_mobile,
      profile_completed: profile.profile_completed,
      beginner: profile.beginner,
    },
  }
}
