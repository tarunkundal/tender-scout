"""FastAPI app factory and the ASGI app instance (`uvicorn app.main:app`)."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.router import api_router
from app.core.config import get_settings
from app.core.db import engine
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.core.logging import configure_logging
from app.core.redis import redis_client

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await redis_client.aclose()
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL)
    if settings.uses_dev_secret_key:
        logger.warning(
            "SECRET_KEY is not set; using the local dev placeholder. "
            "Change me: set SECRET_KEY in backend/.env (required in production)."
        )

    app = FastAPI(title="TenderScout API", version=__version__, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],  # includes Authorization: Bearer <Neon Auth JWT>
    )
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.include_router(api_router, prefix=settings.API_PREFIX)
    logger.info("%s API configured (environment=%s)", settings.APP_NAME, settings.ENVIRONMENT)
    return app


app = create_app()
