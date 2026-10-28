"""Companies, user memberships and consent records.

`user_id` is the Neon Auth user id (JWT `sub` = `neon_auth.user.id`). There is deliberately no
foreign key into the `neon_auth` schema: Neon manages that schema, not our migrations.
Every company-owned row will reference `companies.id`.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.companies.reference import (
    ENTITY_TYPE_CODES,
    REGISTRATION_AUTHORITY_CODES,
    STATE_CODES,
    WORK_TYPE_CODES,
)

ROLE_OWNER = "owner"
CONSENT_TERMS_PRIVACY = "terms_privacy"


def _sql_list(codes: tuple[str, ...]) -> str:
    return ", ".join(f"'{code}'" for code in codes)


class Company(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "companies"
    # Same checks as migration 0003 (names follow the `ck_companies_<name>` convention).
    __table_args__ = (
        CheckConstraint(f"entity_type IN ({_sql_list(ENTITY_TYPE_CODES)})", name="entity_type"),
        CheckConstraint(
            f"registration_authority IN ({_sql_list(REGISTRATION_AUTHORITY_CODES)})",
            name="registration_authority",
        ),
        CheckConstraint(f"states <@ ARRAY[{_sql_list(STATE_CODES)}]::text[]", name="states"),
        CheckConstraint(
            f"work_types <@ ARRAY[{_sql_list(WORK_TYPE_CODES)}]::text[]", name="work_types"
        ),
    )

    name: Mapped[str] = mapped_column(String(200))
    contact_mobile: Mapped[str | None] = mapped_column(String(10))

    # Company profile (Task 4). Codes come from `reference.py`.
    entity_type: Mapped[str | None] = mapped_column(Text)
    states: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default=text("'{}'")
    )
    work_types: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default=text("'{}'")
    )
    registration_authority: Mapped[str | None] = mapped_column(Text)
    registration_class: Mapped[str | None] = mapped_column(String(50))
    has_bid_before: Mapped[bool | None]
    # Set the first time every required profile field is present; the wizard is done after it.
    profile_completed_at: Mapped[datetime | None]

    @property
    def profile_completed(self) -> bool:
        return self.profile_completed_at is not None

    @property
    def beginner(self) -> bool | None:
        """Never bid on a government tender (`None` until answered)."""
        return None if self.has_bid_before is None else not self.has_bid_before


class Membership(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "memberships"

    # One company per user for now (unique), so "the user's company" is unambiguous.
    user_id: Mapped[uuid.UUID] = mapped_column(unique=True)
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(32), default=ROLE_OWNER, server_default=ROLE_OWNER)


class Consent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "consents"

    user_id: Mapped[uuid.UUID] = mapped_column(index=True)
    kind: Mapped[str] = mapped_column(String(32))
    version: Mapped[str] = mapped_column(String(32))
    accepted_at: Mapped[datetime] = mapped_column(server_default=func.now())
    ip: Mapped[str | None] = mapped_column(String(45))  # IPv4 or IPv6 text form
