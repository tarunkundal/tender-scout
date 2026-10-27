"""Verify Neon Auth (Better Auth JWT plugin) access tokens against the branch's JWKS.

Facts this relies on (`.agents/tasks/neon-auth/findings.md` §8 and §14): JWKS at
`{NEON_AUTH_URL}/.well-known/jwks.json`, EdDSA/Ed25519 keys with a `kid`, tokens carry
`sub` (= neon_auth.user.id), `email`, `name`, `emailVerified`, `iat`, `exp` (15 min),
`iss` and `aud` (both the auth origin). Tokens are never logged.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import status

from app.core.config import get_settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

ALGORITHMS = ["EdDSA"]  # the only algorithm Neon's JWKS publishes; never accept others
LEEWAY_SECONDS = 30
JWKS_TIMEOUT_SECONDS = 5


@dataclass(frozen=True)
class TokenClaims:
    sub: uuid.UUID
    email: str | None
    name: str | None
    email_verified: bool | None  # None when the claim is absent


def not_authenticated() -> AppError:
    return AppError(
        status.HTTP_401_UNAUTHORIZED,
        "NOT_AUTHENTICATED",
        "Not signed in or the session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    # JWK Set cached for 5 min; signing keys cached by kid. An unknown kid forces one refetch
    # (rate-limited by PyJWT's cooldown), which picks up rotated keys.
    return jwt.PyJWKClient(
        get_settings().NEON_AUTH_JWKS_URL or "",
        cache_keys=True,
        lifespan=300,
        timeout=JWKS_TIMEOUT_SECONDS,
    )


def _verify_sync(token: str) -> dict[str, Any]:
    settings = get_settings()
    header = jwt.get_unverified_header(token)
    if header.get("alg") not in ALGORITHMS or not header.get("kid"):
        raise jwt.InvalidTokenError("unexpected token header")
    signing_key = _jwks_client().get_signing_key(header["kid"])
    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=ALGORITHMS,
        issuer=settings.NEON_AUTH_ISSUER,
        leeway=LEEWAY_SECONDS,
        # aud is checked below: only when the token carries one.
        options={"require": ["exp", "iat", "sub", "iss"], "verify_aud": False},
    )
    if "aud" in claims:
        aud = claims["aud"]
        audiences = aud if isinstance(aud, list) else [aud]
        if settings.NEON_AUTH_AUDIENCE not in audiences:
            raise jwt.InvalidAudienceError("audience does not match")
    return claims


async def verify_token(token: str) -> TokenClaims:
    """Return the verified claims, or raise 401 NOT_AUTHENTICATED (503 if JWKS is unreachable)."""
    try:
        # PyJWKClient uses blocking urllib; keep it off the event loop.
        claims = await asyncio.to_thread(_verify_sync, token)
        sub = uuid.UUID(str(claims["sub"]))
    except jwt.PyJWKClientConnectionError as exc:
        logger.warning("Neon Auth JWKS fetch failed: %s", type(exc).__name__)
        raise AppError(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "AUTH_UNAVAILABLE",
            "Sign-in service is unavailable. Try again shortly.",
        ) from None
    except (jwt.PyJWTError, ValueError) as exc:
        logger.info("Rejected bearer token: %s", type(exc).__name__)
        raise not_authenticated() from None

    email_verified = claims.get("emailVerified")
    return TokenClaims(
        sub=sub,
        email=claims.get("email") if isinstance(claims.get("email"), str) else None,
        name=claims.get("name") if isinstance(claims.get("name"), str) else None,
        email_verified=email_verified if isinstance(email_verified, bool) else None,
    )
