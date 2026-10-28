"""Option lists with labels for the onboarding wizard and settings (`GET /reference/...`)."""

from fastapi import APIRouter

from app.api.routes.me import AUTH_ERRORS
from app.modules.auth.deps import CurrentUserDep
from app.modules.companies.reference import (
    ENTITY_TYPES,
    REGISTRATION_AUTHORITIES,
    STATES,
    WORK_TYPES,
)
from app.modules.companies.schemas import (
    EntityTypeOption,
    OnboardingOptions,
    RegistrationAuthorityOption,
    StateOption,
    WorkTypeOption,
)

router = APIRouter(prefix="/reference", tags=["reference"])

ONBOARDING_OPTIONS = OnboardingOptions(
    entity_types=[EntityTypeOption(value=k, label=v) for k, v in ENTITY_TYPES.items()],
    states=[StateOption(value=k, label=v) for k, v in STATES.items()],
    work_types=[
        WorkTypeOption(value=k, label=label, hint=hint) for k, (label, hint) in WORK_TYPES.items()
    ],
    registration_authorities=[
        RegistrationAuthorityOption(value=k, label=v) for k, v in REGISTRATION_AUTHORITIES.items()
    ],
)


@router.get("/onboarding", response_model=OnboardingOptions, responses=AUTH_ERRORS)
async def get_onboarding_options(_user: CurrentUserDep) -> OnboardingOptions:
    """Signed-in users only; no company needed (the wizard runs right after company setup)."""
    return ONBOARDING_OPTIONS
