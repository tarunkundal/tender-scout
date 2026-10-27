"""The signed-in user (`GET /me`) and the one-time company setup (`POST /me/company`)."""

from fastapi import APIRouter, Request, status
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.errors import AppError, ErrorResponse
from app.modules.auth.deps import (
    CurrentCompany,
    CurrentUser,
    CurrentUserDep,
    SessionDep,
    get_user_company,
)
from app.modules.companies.models import (
    CONSENT_TERMS_PRIVACY,
    ROLE_OWNER,
    Company,
    Consent,
    Membership,
)
from app.modules.companies.schemas import CompanyCreate, MeCompany, MeResponse, MeUser

router = APIRouter(prefix="/me", tags=["me"])

AUTH_ERRORS: dict[int | str, dict] = {
    status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse, "description": "NOT_AUTHENTICATED"},
    status.HTTP_403_FORBIDDEN: {"model": ErrorResponse, "description": "EMAIL_NOT_VERIFIED"},
}


def company_exists() -> AppError:
    return AppError(status.HTTP_409_CONFLICT, "COMPANY_EXISTS", "Your company is already set up.")


def to_me(user: CurrentUser, current: CurrentCompany | None) -> MeResponse:
    return MeResponse(
        user=MeUser(
            id=user.id, email=user.email, name=user.name, email_verified=user.email_verified
        ),
        company=(
            MeCompany(
                id=current.company.id,
                name=current.company.name,
                contact_mobile=current.company.contact_mobile,
            )
            if current
            else None
        ),
        role=current.role if current else None,
    )


@router.get("", response_model=MeResponse, responses=AUTH_ERRORS)
async def get_me(user: CurrentUserDep, session: SessionDep) -> MeResponse:
    return to_me(user, await get_user_company(session, user.id))


@router.post(
    "/company",
    response_model=MeResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **AUTH_ERRORS,
        status.HTTP_409_CONFLICT: {"model": ErrorResponse, "description": "COMPANY_EXISTS"},
    },
)
async def create_company(
    body: CompanyCreate, request: Request, user: CurrentUserDep, session: SessionDep
) -> MeResponse:
    if await get_user_company(session, user.id) is not None:
        raise company_exists()

    company = Company(name=body.company_name, contact_mobile=body.contact_mobile)
    try:
        session.add(company)
        await session.flush()  # assigns company.id
        session.add(Membership(user_id=user.id, company_id=company.id, role=ROLE_OWNER))
        session.add(
            Consent(
                user_id=user.id,
                kind=CONSENT_TERMS_PRIVACY,
                version=get_settings().CONSENT_VERSION,
                ip=request.client.host if request.client else None,
            )
        )
        await session.commit()
    except IntegrityError:
        # A concurrent request created the membership first (unique user_id).
        await session.rollback()
        raise company_exists() from None
    return to_me(user, CurrentCompany(company=company, role=ROLE_OWNER))
