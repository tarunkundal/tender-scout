"""Application settings, read from environment variables and backend/.env."""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any, Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy.engine import URL, make_url

BACKEND_DIR = Path(__file__).resolve().parents[2]

# Used only when ENVIRONMENT=local and SECRET_KEY is not set. A warning is logged at startup.
LOCAL_DEV_SECRET_KEY = "change-me-local-dev-only"

_POSTGRES_SCHEMES = {"postgres", "postgresql", "postgresql+asyncpg"}
# libpq-only query params that asyncpg rejects as connect() kwargs. `sslmode` is translated to
# asyncpg's `ssl` connect arg; `channel_binding` has no asyncpg equivalent and is dropped.
_LIBPQ_ONLY_PARAMS = ("sslmode", "channel_binding")
_SSL_MODES = {"disable", "allow", "prefer", "require", "verify-ca", "verify-full"}


@dataclass(frozen=True)
class AsyncpgTarget:
    """A database URL normalized for SQLAlchemy's asyncpg dialect plus its connect args."""

    url: URL
    connect_args: dict[str, Any]


def to_asyncpg(raw_url: str) -> AsyncpgTarget:
    """Normalize a Postgres URL (plain `postgres://` from Neon included) for asyncpg."""
    url = make_url(raw_url)
    if url.drivername not in _POSTGRES_SCHEMES:
        raise ValueError(
            "Database URL must use postgres://, postgresql:// or postgresql+asyncpg://"
        )

    connect_args: dict[str, Any] = {}
    sslmode = url.query.get("sslmode")
    if isinstance(sslmode, tuple):  # repeated param: last one wins
        sslmode = sslmode[-1]
    if sslmode is not None:
        if sslmode not in _SSL_MODES:
            raise ValueError(f"Unsupported sslmode in database URL: {sslmode}")
        connect_args["ssl"] = sslmode

    url = url.set(drivername="postgresql+asyncpg").difference_update_query(_LIBPQ_ONLY_PARAMS)
    return AsyncpgTarget(url=url, connect_args=connect_args)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,  # `KEY=` in .env means "use the default"
        extra="ignore",
        hide_input_in_errors=True,  # validation errors must not echo URLs with passwords
    )

    ENVIRONMENT: Literal["local", "production"] = "local"
    APP_NAME: str = "TenderScout"
    API_PREFIX: str = ""  # "" keeps routes at the root, e.g. /health
    SECRET_KEY: SecretStr | None = None  # required in production
    LOG_LEVEL: str = "INFO"

    # Pooled URL for the API and workers; direct URL for Alembic and the LangGraph checkpointer.
    DATABASE_URL: str = "postgresql+asyncpg://tenderscout:tenderscout@localhost:5432/tenderscout"
    DATABASE_URL_DIRECT: str | None = None  # defaults to DATABASE_URL
    DB_DISABLE_PREPARED_STATEMENTS: bool = False  # set True behind Neon's pooled (PgBouncer) URL
    DB_POOL_SIZE: int = Field(default=5, ge=1)
    DB_POOL_RECYCLE_SECONDS: int = Field(default=300, ge=1)

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str | None = None  # defaults to REDIS_URL
    CELERY_RESULT_BACKEND: str | None = None  # defaults to REDIS_URL

    # Accepts a JSON list or a comma-separated string.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    # Neon Managed Better Auth (per Neon branch). We only verify its JWTs; no passwords here.
    NEON_AUTH_URL: str  # e.g. https://ep-xxx.neonauth.<region>.aws.neon.tech/neondb/auth
    NEON_AUTH_JWKS_URL: str | None = None  # defaults to {NEON_AUTH_URL}/.well-known/jwks.json
    # Observed in real tokens (findings §14): iss and aud are both the origin of NEON_AUTH_URL,
    # e.g. https://ep-xxx.neonauth.<region>.aws.neon.tech. Both default to that origin.
    NEON_AUTH_ISSUER: str | None = None
    NEON_AUTH_AUDIENCE: str | None = None
    # Version of the Terms + Privacy text the user accepts at company setup.
    CONSENT_VERSION: str = "2026-10-22"

    # Placeholders for later tasks (AI core, Task 6). Unused for now.
    LLM_SMALL_MODEL: str | None = None
    LLM_STRONG_MODEL: str | None = None
    EMBEDDING_MODEL: str | None = None
    LANGSMITH_TRACING: bool | None = None
    LANGSMITH_API_KEY: SecretStr | None = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("DATABASE_URL", "DATABASE_URL_DIRECT")
    @classmethod
    def _check_db_url(cls, value: str | None) -> str | None:
        if value is not None:
            to_asyncpg(value)  # raises ValueError on an unsupported scheme or sslmode
        return value

    @model_validator(mode="after")
    def _apply_defaults(self) -> "Settings":
        if self.DATABASE_URL_DIRECT is None:
            self.DATABASE_URL_DIRECT = self.DATABASE_URL
        if self.CELERY_BROKER_URL is None:
            self.CELERY_BROKER_URL = self.REDIS_URL
        if self.CELERY_RESULT_BACKEND is None:
            self.CELERY_RESULT_BACKEND = self.REDIS_URL

        self.NEON_AUTH_URL = self.NEON_AUTH_URL.rstrip("/")
        auth_url = urlsplit(self.NEON_AUTH_URL)
        if auth_url.scheme != "https" or not auth_url.netloc:
            raise ValueError("NEON_AUTH_URL must be an https:// URL")
        auth_origin = f"{auth_url.scheme}://{auth_url.netloc}"
        if self.NEON_AUTH_JWKS_URL is None:
            self.NEON_AUTH_JWKS_URL = f"{self.NEON_AUTH_URL}/.well-known/jwks.json"
        if self.NEON_AUTH_ISSUER is None:
            self.NEON_AUTH_ISSUER = auth_origin
        if self.NEON_AUTH_AUDIENCE is None:
            self.NEON_AUTH_AUDIENCE = auth_origin

        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY is None or self.SECRET_KEY.get_secret_value() in (
                "",
                LOCAL_DEV_SECRET_KEY,
            ):
                raise ValueError("SECRET_KEY must be set to a strong random value in production")
        elif self.SECRET_KEY is None:
            self.SECRET_KEY = SecretStr(LOCAL_DEV_SECRET_KEY)
        return self

    @property
    def uses_dev_secret_key(self) -> bool:
        return self.SECRET_KEY is not None and (
            self.SECRET_KEY.get_secret_value() == LOCAL_DEV_SECRET_KEY
        )

    @property
    def database(self) -> AsyncpgTarget:
        """Pooled database target (API and workers)."""
        return to_asyncpg(self.DATABASE_URL)

    @property
    def database_direct(self) -> AsyncpgTarget:
        """Direct database target (Alembic, later the LangGraph checkpointer)."""
        return to_asyncpg(self.DATABASE_URL_DIRECT or self.DATABASE_URL)


@lru_cache
def get_settings() -> Settings:
    return Settings()
