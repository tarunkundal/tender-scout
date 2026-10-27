"""Companies, user memberships and consent records.

`user_id` is the Neon Auth user id (JWT `sub` = `neon_auth.user.id`). There is deliberately no
foreign key into the `neon_auth` schema: Neon manages that schema, not our migrations.
Every company-owned row will reference `companies.id`.
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, TimestampMixin, UUIDPrimaryKeyMixin

ROLE_OWNER = "owner"
CONSENT_TERMS_PRIVACY = "terms_privacy"


class Company(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200))
    contact_mobile: Mapped[str | None] = mapped_column(String(10))


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
