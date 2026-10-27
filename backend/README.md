# TenderScout backend

FastAPI API + Celery workers + Celery Beat in one Python project (modular monolith).

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 for you)
- A Neon project with a dev branch (`dev`) and Neon Auth enabled on it
- Docker (Redis, Mailpit)

## Run locally (from the repo root)

```sh
make up                               # start redis, mailpit (and the unused local db)
cp backend/.env.example backend/.env  # then fill in the Neon URLs and NEON_AUTH_URL
make install                          # uv sync + frontend npm install
make migrate                          # alembic upgrade head on the Neon dev branch
make dev                              # API on http://localhost:8000
make worker                           # Celery worker (separate terminal)
```

Health check: http://localhost:8000/health returns `{"status":"ok","db":"ok","redis":"ok",...}`
(503 if the database or Redis is down). API docs: http://localhost:8000/docs.
Mailpit UI: http://localhost:8025. `make help` lists all targets.

## Neon notes

- Local dev uses the Neon branch `dev`, not the Docker `db` service: Neon Auth
  needs a real Neon database. `make migrate` therefore changes that Neon branch.
- `DATABASE_URL` is the pooled URL (host contains `-pooler`), used by the API and workers.
  Set `DB_DISABLE_PREPARED_STATEMENTS=true` with it: the pooler is PgBouncer, which does not
  work with asyncpg's prepared-statement cache.
- `DATABASE_URL_DIRECT` is the direct URL (no `-pooler`), used by Alembic and later the
  LangGraph checkpointer. It defaults to `DATABASE_URL` when empty.
- Neon's plain `postgresql://...?sslmode=require&channel_binding=require` URLs can be pasted
  as-is: they are converted to `postgresql+asyncpg://` and `sslmode` becomes asyncpg's `ssl`.
- Alembic ignores the `neon_auth` schema (Neon owns it). Never edit it with migrations.

## Auth (Neon Managed Better Auth)

- Sign-up, sign-in, email verification codes, password reset and Google sign-in all happen
  between the frontend SDK (`@neondatabase/neon-js`) and Neon Auth. This API never handles
  passwords or session cookies. Users live in `neon_auth.user` on each branch.
- The frontend sends `Authorization: Bearer <JWT>`. `app/modules/auth/jwt.py` verifies it with
  PyJWT against `{NEON_AUTH_URL}/.well-known/jwks.json` (EdDSA only; `exp`, `iat`, `sub`, `iss`
  required; `aud` checked when present; 30 s leeway). Bad or missing tokens get 401
  `NOT_AUTHENTICATED`; unverified emails get 403 `EMAIL_NOT_VERIFIED`.
- `sub` is the Neon user id. Our `memberships.user_id` stores it (no FK into `neon_auth`).
  `GET /me` returns the user and their company; `POST /me/company` creates it once, with the
  consent record. Company-scoped endpoints use the `get_current_company` dependency and must
  filter every query by its `company.id`.
