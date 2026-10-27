"""FastAPI dependencies: the signed-in Neon Auth user and their company.

FastAPI never sees passwords or the Neon session cookie, only the Bearer JWT from the SDK.
"""

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.errors import AppError
from app.modules.auth.jwt import not_authenticated, verify_token
from app.modules.companies.models import ROLE_OWNER, Company, Membership

# auto_error=False: a missing/non-Bearer header becomes our own 401 NOT_AUTHENTICATED body.
bearer_scheme = HTTPBearer(auto_error=False, description="Neon Auth JWT (session.token)")

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID  # Neon Auth user id (JWT sub)
    email: str
    name: str | None
    email_verified: bool


@dataclass(frozen=True)
class CurrentCompany:
    company: Company
    role: str


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise not_authenticated()
    claims = await verify_token(credentials.credentials)

    email, name, email_verified = claims.email, claims.name, claims.email_verified
    if email_verified is None or email is None:
        # Claim missing: fall back to Neon Auth's user table (read-only, never written by us).
        row = (
            await session.execute(
                text('select email, name, "emailVerified" from neon_auth."user" where id = :sub'),
                {"sub": claims.sub},
            )
        ).first()
        if row is None:
            raise not_authenticated()
        email = email or row.email
        name = name or row.name
        email_verified = bool(row.emailVerified) if email_verified is None else email_verified

    if not email_verified:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "EMAIL_NOT_VERIFIED",
            "Verify your email address to continue.",
        )
    return CurrentUser(id=claims.sub, email=email, name=name, email_verified=True)


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


async def get_user_company(session: AsyncSession, user_id: uuid.UUID) -> CurrentCompany | None:
    """The company the user owns (one per user; team roles come later)."""
    row = (
        await session.execute(
            select(Company, Membership.role)
            .join(Membership, Membership.company_id == Company.id)
            .where(Membership.user_id == user_id, Membership.role == ROLE_OWNER)
        )
    ).first()
    return CurrentCompany(company=row[0], role=row[1]) if row else None


async def get_current_company(user: CurrentUserDep, session: SessionDep) -> CurrentCompany:
    """For company-scoped endpoints: every query must filter by `.company.id`."""
    current = await get_user_company(session, user.id)
    if current is None:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "COMPANY_REQUIRED",
            "Set up your company first.",
        )
    return current


CurrentCompanyDep = Annotated[CurrentCompany, Depends(get_current_company)]
