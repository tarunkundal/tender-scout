# TenderScout backend

FastAPI API + Celery workers + Celery Beat in one Python project (modular monolith).

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 for you)
- Docker (Postgres + pgvector, Redis, Mailpit)

## Run locally (from the repo root)

```sh
make up                               # start db, redis, mailpit
cp backend/.env.example backend/.env  # local defaults work as-is
make install                          # uv sync + frontend npm install
make migrate                          # alembic upgrade head (enables pgvector)
make dev                              # API on http://localhost:8000
make worker                           # Celery worker (separate terminal)
```

Health check: http://localhost:8000/health returns `{"status":"ok","db":"ok","redis":"ok",...}`
(503 if the database or Redis is down). API docs: http://localhost:8000/docs.
Mailpit UI: http://localhost:8025. `make help` lists all targets.

## Neon notes

- `DATABASE_URL` is the pooled URL (host contains `-pooler`), used by the API and workers.
  Set `DB_DISABLE_PREPARED_STATEMENTS=true` with it: the pooler is PgBouncer, which does not
  work with asyncpg's prepared-statement cache.
- `DATABASE_URL_DIRECT` is the direct URL (no `-pooler`), used by Alembic and later the
  LangGraph checkpointer. It defaults to `DATABASE_URL` when empty.
- Neon's plain `postgresql://...?sslmode=require&channel_binding=require` URLs can be pasted
  as-is: they are converted to `postgresql+asyncpg://` and `sslmode` becomes asyncpg's `ssl`.
