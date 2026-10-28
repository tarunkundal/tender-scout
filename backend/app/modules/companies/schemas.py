"""Request/response models for `/me`, `/company` and `/reference` (drive the frontend types)."""

import re
import uuid
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field, field_validator, model_validator

from app.modules.companies.reference import (
    REGISTRATION_NONE,
    EntityType,
    RegistrationAuthority,
    StateCode,
    WorkType,
)

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")  # Indian mobile: 10 digits starting 6-9


def _collapse_spaces(value: object) -> object:
    return " ".join(value.split()) if isinstance(value, str) else value


def _blank_to_none(value: object) -> object:
    value = _collapse_spaces(value)
    return None if value == "" else value


def _check_mobile(value: object) -> object:
    if isinstance(value, str):
        value = value.strip()
        if value == "":
            return None
        if not MOBILE_RE.fullmatch(value):
            raise ValueError("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.")
    return value


def _reject_duplicates(values: list[str], message: str) -> list[str]:
    if len(set(values)) != len(values):
        raise ValueError(message)
    return values


CompanyName = Annotated[str, BeforeValidator(_collapse_spaces), Field(min_length=2, max_length=200)]
Mobile = Annotated[str | None, BeforeValidator(_check_mobile)]
# The length limit sits on the `str` branch only: on the outer `str | None` Pydantic applies it
# to None too and raises a TypeError (a 500, not a 422) for an empty or null class.
RegistrationClass = Annotated[
    Annotated[str, Field(max_length=50)] | None, BeforeValidator(_blank_to_none)
]


class MeUser(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    email_verified: bool


class MeCompany(BaseModel):
    id: uuid.UUID
    name: str
    contact_mobile: str | None
    profile_completed: bool
    beginner: bool | None = Field(
        description="True when the company has never bid on a government tender; null until asked."
    )


class MeResponse(BaseModel):
    user: MeUser
    company: MeCompany | None
    role: str | None


class CompanyCreate(BaseModel):
    company_name: CompanyName
    contact_mobile: Mobile = None
    consent: bool

    @field_validator("consent")
    @classmethod
    def _require_consent(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Accept the Terms and Privacy Policy to continue.")
        return value


class CompanyProfile(BaseModel):
    """`GET`/`PUT /company/profile` response."""

    name: str
    contact_mobile: str | None
    entity_type: EntityType | None
    states: list[StateCode]
    work_types: list[WorkType]
    registration_authority: RegistrationAuthority | None
    registration_class: str | None
    has_bid_before: bool | None
    beginner: bool | None
    profile_completed: bool


class CompanyProfileUpdate(BaseModel):
    """`PUT /company/profile`: the whole profile. Every field is required except the mobile
    number and the registration class (dropped when the authority is `none`)."""

    name: CompanyName
    contact_mobile: Mobile = None
    entity_type: EntityType
    states: Annotated[list[StateCode], Field(min_length=1, max_length=36)]
    work_types: Annotated[list[WorkType], Field(min_length=1, max_length=8)]
    registration_authority: RegistrationAuthority
    registration_class: RegistrationClass = None
    has_bid_before: bool

    @field_validator("states")
    @classmethod
    def _unique_states(cls, value: list[str]) -> list[str]:
        return _reject_duplicates(value, "Each state can be selected only once.")

    @field_validator("work_types")
    @classmethod
    def _unique_work_types(cls, value: list[str]) -> list[str]:
        return _reject_duplicates(value, "Each work type can be selected only once.")

    @model_validator(mode="after")
    def _drop_class_without_registration(self) -> "CompanyProfileUpdate":
        if self.registration_authority == REGISTRATION_NONE:
            self.registration_class = None
        return self


class EntityTypeOption(BaseModel):
    value: EntityType
    label: str


class StateOption(BaseModel):
    value: StateCode
    label: str


class WorkTypeOption(BaseModel):
    value: WorkType
    label: str
    hint: str


class RegistrationAuthorityOption(BaseModel):
    value: RegistrationAuthority
    label: str


class OnboardingOptions(BaseModel):
    """`GET /reference/onboarding`: option lists with display labels, in display order."""

    entity_types: list[EntityTypeOption]
    states: list[StateOption]
    work_types: list[WorkTypeOption]
    registration_authorities: list[RegistrationAuthorityOption]
