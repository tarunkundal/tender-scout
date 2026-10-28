"""The signed-in user's company profile (`GET`/`PUT /company/profile`), company-scoped."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, status
from sqlalchemy.exc import IntegrityError

from app.api.routes.me import AUTH_ERRORS
from app.core.errors import AppError, ErrorResponse
from app.modules.auth.deps import CurrentCompanyDep, SessionDep
from app.modules.companies.models import Company
from app.modules.companies.schemas import CompanyProfile, CompanyProfileUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/company", tags=["company"])

COMPANY_ERRORS: dict[int | str, dict] = {
    **AUTH_ERRORS,
    status.HTTP_409_CONFLICT: {"model": ErrorResponse, "description": "COMPANY_REQUIRED"},
}


def is_profile_complete(company: Company) -> bool:
    """Every field the wizard asks for is filled in (mobile and registration class optional)."""
    return bool(
        company.name
        and company.entity_type
        and company.states
        and company.work_types
        and company.registration_authority
        and company.has_bid_before is not None
    )


def to_profile(company: Company) -> CompanyProfile:
    return CompanyProfile(
        name=company.name,
        contact_mobile=company.contact_mobile,
        entity_type=company.entity_type,
        states=company.states,
        work_types=company.work_types,
        registration_authority=company.registration_authority,
        registration_class=company.registration_class,
        has_bid_before=company.has_bid_before,
        beginner=company.beginner,
        profile_completed=company.profile_completed,
    )


@router.get("/profile", response_model=CompanyProfile, responses=COMPANY_ERRORS)
async def get_profile(current: CurrentCompanyDep) -> CompanyProfile:
    return to_profile(current.company)


@router.put("/profile", response_model=CompanyProfile, responses=COMPANY_ERRORS)
async def update_profile(
    body: CompanyProfileUpdate, current: CurrentCompanyDep, session: SessionDep
) -> CompanyProfile:
    # `current.company` was loaded through this request's session (`get_current_company`), and
    # only the caller's own company is ever loaded there, so this update is company-scoped.
    company = current.company
    company.name = body.name
    company.contact_mobile = body.contact_mobile
    company.entity_type = body.entity_type
    company.states = list(body.states)
    company.work_types = list(body.work_types)
    company.registration_authority = body.registration_authority
    company.registration_class = body.registration_class  # None when authority is "none"
    company.has_bid_before = body.has_bid_before
    if company.profile_completed_at is None and is_profile_complete(company):
        company.profile_completed_at = datetime.now(UTC)
    try:
        await session.commit()
    except IntegrityError as exc:
        # Pydantic should have caught this (a DB CHECK out of sync with reference.py?). Log the
        # class and constraint only: the exception text carries the submitted values.
        await session.rollback()
        driver_error = getattr(exc.orig, "__cause__", None) or exc.orig
        logger.error(
            "PUT /company/profile rejected by the database: %s (%s, constraint=%s)",
            type(exc).__name__,
            type(driver_error).__name__,
            getattr(driver_error, "constraint_name", None),
        )
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "PROFILE_REJECTED",
            "We couldn't save this profile. Check your choices and try again.",
        ) from None
    return to_profile(company)
