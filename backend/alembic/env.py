"""Alembic environment (async). Uses DATABASE_URL_DIRECT from app settings, never alembic.ini."""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

import app.modules.companies.models  # noqa: F401
from alembic import context
from app.core.config import get_settings
from app.core.db import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Every model module is imported above so autogenerate sees its tables. Add new ones there.
target_metadata = Base.metadata

# Migrations always use the direct (non-pooled) URL.
db_target = get_settings().database_direct

# Schemas owned by Neon (Neon Auth). Autogenerate must never diff, create or drop them.
IGNORED_SCHEMAS = {"neon_auth"}


def include_name(name, type_, parent_names) -> bool:
    if type_ == "schema":
        return name not in IGNORED_SCHEMAS
    return parent_names.get("schema_name") not in IGNORED_SCHEMAS


def include_object(obj, name, type_, reflected, compare_to) -> bool:
    schema = getattr(obj, "schema", None)
    if schema is None and type_ != "table":
        schema = getattr(getattr(obj, "table", None), "schema", None)
    return schema not in IGNORED_SCHEMAS


FILTERS = {"include_name": include_name, "include_object": include_object}


def run_migrations_offline() -> None:
    """Emit SQL to stdout without connecting (`alembic upgrade head --sql`)."""
    context.configure(
        url=db_target.url.render_as_string(hide_password=False),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        **FILTERS,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, target_metadata=target_metadata, compare_type=True, **FILTERS
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(
        db_target.url,
        poolclass=pool.NullPool,
        connect_args=db_target.connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
