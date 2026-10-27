"""Health check: database and Redis reachability."""

import asyncio
import logging
from collections.abc import Awaitable
from typing import Literal

from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from sqlalchemy import text

from app import __version__
from app.core.db import engine
from app.core.redis import redis_client

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

# Neon (us-east-2) from India is ~350 ms RTT; ping + BEGIN + SELECT through the pooler takes
# ~2.5 s there, so 2 s always timed out. Revisit when the project moves to an Asia region.
CHECK_TIMEOUT_SECONDS = 5.0

CheckStatus = Literal["ok", "error"]


class HealthResponse(BaseModel):
    status: CheckStatus
    db: CheckStatus
    redis: CheckStatus
    version: str


async def _check(name: str, probe: Awaitable[object]) -> CheckStatus:
    try:
        async with asyncio.timeout(CHECK_TIMEOUT_SECONDS):
            await probe
    except Exception as exc:  # report only the failing part, never connection details
        logger.warning("Health check %s failed: %s", name, type(exc).__name__)
        return "error"
    return "ok"


async def _ping_db() -> None:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthResponse}},
)
async def health(response: Response) -> HealthResponse:
    db, redis = await asyncio.gather(
        _check("db", _ping_db()),
        _check("redis", redis_client.ping()),
    )
    healthy = db == "ok" and redis == "ok"
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="ok" if healthy else "error",
        db=db,
        redis=redis,
        version=__version__,
    )
