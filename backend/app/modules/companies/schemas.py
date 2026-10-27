"""Request/response models for `/me` (also drive the generated frontend types)."""

import re
import uuid
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")  # Indian mobile: 10 digits starting 6-9


class MeUser(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    email_verified: bool


class MeCompany(BaseModel):
    id: uuid.UUID
    name: str
    contact_mobile: str | None


class MeResponse(BaseModel):
    user: MeUser
    company: MeCompany | None
    role: str | None


class CompanyCreate(BaseModel):
    company_name: Annotated[str, Field(min_length=2, max_length=200)]
    contact_mobile: str | None = None
    consent: bool

    @field_validator("company_name", mode="before")
    @classmethod
    def _strip_name(cls, value: object) -> object:
        return " ".join(value.split()) if isinstance(value, str) else value

    @field_validator("contact_mobile", mode="before")
    @classmethod
    def _check_mobile(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if value == "":
                return None
            if not MOBILE_RE.fullmatch(value):
                raise ValueError("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.")
        return value

    @field_validator("consent")
    @classmethod
    def _require_consent(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Accept the Terms and Privacy Policy to continue.")
        return value
