# TenderScout: project requirements and rules

This file is the single source of truth for what we are building and how. It is loaded into every session.
When a decision changes, update this file first (and add a line to the Change log at the bottom), then update `docs/PLAN.md`.

## Product in one paragraph

TenderScout helps Indian MSME civil contractors find government tenders they can win. Users upload their own company documents (never tender PDFs). Every night our backend fetches civil works tenders from government portals, reads the tender PDFs with AI, and matches each tender's eligibility rules against the user's confirmed company profile. The output is a Bid / No-Bid verdict where every rule is ✅ Met / ❌ Not met / ❓ Unclear and cites two proofs: the tender page and the user's document. Goals: a portfolio/resume project and a startup pitch demo.

## Locked decisions

| Area | Decision |
|---|---|
| Domain | Civil works first (CPWD, MES, state PWD type tenders). Other domains later. |
| Tender source | Our own scrapers, daily cron (Celery Beat, 02:00 IST). CPPP first, then GeM and one state NIC portal. |
| Company documents | Full set: GST, PAN, Udyam, ITR/balance sheets, work orders, completion certificates, contractor registration/enlistment, bank solvency, EPF/ESIC, labour licence, ISO, partnership deed/POA. |
| Tender links | Every tender stores and shows: official portal link ("View on CPPP ↗"), tender ref ID with copy button, `last_checked_at`, and our PDF copy opened at the cited page (`file.pdf#page=N`). |
| Architecture | Modular monolith: one Python backend, run as FastAPI API process + Celery workers + Celery Beat. |
| Database | Neon Postgres + pgvector. Local dev also uses Neon: the `dev` branch, because Neon Auth needs a real Neon DB. Docker runs only Redis + Mailpit for dev (the Docker Postgres service is no longer used by the app). |
| Auth | Neon Managed Better Auth. Frontend uses `@neondatabase/neon-js` (`createAuthClient(VITE_NEON_AUTH_URL)`) for sign-up, sign-in, sign-out, email verification (6-digit code), password reset and Google sign-in (Neon shared dev OAuth keys for now; own Google OAuth app before launch). Users/sessions live in the `neon_auth` schema. FastAPI never handles passwords: it verifies the SDK's JWT (`Authorization: Bearer`) against Neon's JWKS with PyJWT and maps `sub` to our `companies`/`memberships`. Email verification is enabled in the Neon console; unverified users cannot use the app. Each Neon branch has its own auth URL and users. The old self-built auth is archived on git branch `archive/own-auth` (reference only, to be discarded later). |
| AI | LangChain + LangGraph for ALL AI work (see "LangChain-first rule"). Hosted LLM APIs, provider-agnostic. |
| ML | scikit-learn domain classifier (civil works or not) on LangChain embeddings. LightGBM fit ranker later, from Bid/Skip feedback. |
| Tests | No tests and no test libraries. Each task is verified by build/lint plus a manual demo. |
| Frontend | Existing React 19 + Vite 8 + TS 6 + Tailwind 4 + shadcn/ui + React Router 7 app in `frontend/`. |

Defaults chosen by the assistant (user has not confirmed yet; change here if they do):
- LLM: provider-agnostic; `small` model for classification/validation, `strong` model for extraction and judgments.
- Beginner mode in v1: readiness checklist + "Why can't I bid?" only. Starter tenders feed later.
- Hosting: local first, cloud deploy is the last task.

## LangChain-first rule

Use the LangChain/LangGraph piece for every AI job. Do not write custom wrappers for these.

| Job | Use |
|---|---|
| Chat models | `init_chat_model` (routes `small` / `strong` from config) |
| Structured extraction | `.with_structured_output(PydanticModel)` |
| PDF, OCR, tables, page numbers, chunking | `DoclingLoader` from `langchain-docling[local]` (installs PyTorch, heavy) |
| Embeddings | `init_embeddings` |
| Vector store + hybrid search | `PGVectorStore` + `HybridSearchConfig` from `langchain-postgres` (NOT the deprecated `PGVector`) |
| Retrieval | `store.as_retriever(search_kwargs={"filter": {...}})`, always filtered by `company_id` or `tender_id` |
| Agents / orchestration | LangGraph `StateGraph`, `Send` (parallel), `interrupt` (human review) |
| Memory / checkpoints / chat history | LangGraph Postgres checkpointer (Neon direct URL) |
| Tools | `@tool` |
| Chat agent | LangChain prebuilt tool-calling agent |
| LLM cache | `set_llm_cache` with Redis |
| Fetching portal pages | `WebBaseLoader`; `PlaywrightURLLoader` for JS-heavy portals (verify they handle the portal tables) |
| Tracing | LangSmith via env vars only |

Allowed non-LangChain packages (keep to this list; ask before adding others):
FastAPI, uvicorn (ASGI server), Pydantic/pydantic-settings, SQLAlchemy 2 (async) + Alembic, asyncpg/psycopg, Celery + Redis, redis (redis-py client), PyJWT[crypto] (verify Neon Auth JWTs via JWKS), BeautifulSoup (listing tables), scikit-learn + joblib, uv, ruff. Frontend adds: TanStack Query, openapi-typescript, `@neondatabase/neon-js` (Neon Auth SDK).

Do NOT add: any test framework, Langfuse, Sentry, structlog, mypy, MinIO, SSE, react-pdf, separate vector DB, Supabase, Firebase, our own password/session auth (pwdlib, refresh tokens, CSRF cookies), Auth0/Clerk.

## AI design rules

1. The LLM reads, code decides. All number comparisons (turnover, solvency, work value, %) are plain Python functions exposed as `@tool`s.
2. No proof, no verdict. Any rule result missing either the tender citation (page) or the company evidence (document + field) becomes ❓ Unclear (the Auditor node enforces this).
3. Agents only where judgment is needed. Scraping, dedupe, ML filter, storage and math are plain code.
4. Cost funnel: SQL prefilter → vector similarity → LLM agents only on the shortlist.
5. Embed only key tender sections by default (eligibility, scope, dates, EMD, similar-work definition). Embed the full tender only when a user opens chat. Neon free plan is 1 GB.
6. Every extracted rule/field stores `page`, a short source `quote`, and `schema_version`.

### LangGraph graphs (backend/app/modules/ai/graphs/)

- `document_agent`: classify (small) → extract (strong, Pydantic schema per doc type, page per field) → validate (formats, dates, amounts; retry extract max 2) → `interrupt` for user review → save `company_facts` + `company_works` embeddings.
- `tender_analyst`: find_sections (hybrid retriever by `tender_id`) → extract_rules (strong) → validate (retry max 2) → summarize → save `tender_rules`.
- `eligibility_team`: supervisor (tool-calling pattern, not the `langgraph-supervisor` library) → `Send` in parallel to Financial, Compliance, Experience Matcher (retriever + LLM judge, math in code), Benefits → Auditor → Gap Advisor → verdict, fit score, checklist.
- `chat_agent`: prebuilt tool-calling agent; tools `search_tender`, `get_rules`, `get_my_documents`, `get_verdict`; must answer "I couldn't find this in the tender" when there is no source.

Rule types for civil works: `min_avg_turnover`, `similar_works` (n × % of estimated cost, e.g. 3×40% / 2×60% / 1×80%; confirm from CPWD docs), `registration_class`, `solvency`, `experience_years`, `certifications`, `labour_compliance`, `jv_allowed`, `msme_relaxation`, `emd`, `key_dates`.

## Repo layout (where things go)

```
tender_scout/
  .kiro/steering/project.md      # this file
  docs/PLAN.md                   # task list + status (update as tasks finish)
  docs/research/                 # portal research, CPWD rules, etc.
  docker-compose.yml             # postgres+pgvector, redis, mailpit
  Makefile                       # up, down, dev, worker, beat, types, ingest
  frontend/
    src/pages/                   # route pages
    src/components/{ui,layout,landing,tender,chat,pdf,pipeline}/
    src/lib/api.ts               # ALL data access (TanStack Query hooks call this)
    src/types/api.ts             # generated by `make types` (openapi-typescript), never hand-edit
  backend/
    app/api/                     # FastAPI routers
    app/core/                    # config, db, security, storage interface
    app/modules/
      auth/ companies/ documents/ tenders/ matching/ notifications/
      ingestion/                 # one PortalAdapter per portal
      ai/models.py               # init_chat_model / init_embeddings / cache
      ai/graphs/                 # document_agent, tender_analyst, eligibility_team, chat_agent
      ai/schemas/                # Pydantic schema per document type and rule type
    app/workers/                 # Celery app, queues, beat schedule
    app/ml/                      # domain classifier training + model files
    alembic/
```

## Engineering conventions

- Python 3.12+, managed with uv. Lint with `ruff check`. Pin exact versions (check PyPI/npm for current versions at install time).
- Env: `backend/.env` has `DATABASE_URL` (pooled, `-pooler` host), `DATABASE_URL_DIRECT`, `DB_DISABLE_PREPARED_STATEMENTS=true`, `NEON_AUTH_URL`; `frontend/.env` has `VITE_NEON_AUTH_URL`, `VITE_API_BASE_URL=/api` (Vite proxies `/api` → `localhost:8000`). Dev branch auth URL: `https://ep-muddy-cell-b5gjgdjp.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth` (not a secret). Project region is us-east-2; reconsider an Asia region before production.
- Never write, delete or truncate anything in the `neon_auth` schema except a throwaway test user's own rows (`neon_auth."user"` by exact email, plus its `verification` rows by identifier). Never touch `project_config` or `jwks`. On 2026-10-26 the dev branch's `project_config` row went missing (cause unknown) and Neon Auth broke with "Project config not found".
- Neon: `DATABASE_URL` = pooled (app, workers), `DATABASE_URL_DIRECT` = direct (Alembic, LangGraph checkpointer). Disable asyncpg prepared-statement cache behind the pooler. Short pool idle timeouts so Neon can scale to zero.
- Multi-tenancy: every company-owned query and every retriever filters by `company_id`. A user must never see another company's data.
- Files: `Storage` interface; local private disk now, S3-compatible cloud storage at deploy. Files served only through authenticated endpoints. Never commit real documents or personal data; use synthetic samples.
- Secrets only in `.env` (git-ignored); keep `.env.example` updated.
- Scraping ethics: respect robots.txt and terms, per-portal rate limits, identifying User-Agent, never bypass captchas. If documents are captcha-gated, store links only.
- Privacy (DPDP Act 2023): consent record on first upload, account deletion removes rows + vectors + files, LLM provider no-retention where offered. Do not claim security guarantees in UI copy that the product does not yet deliver.
- Status updates in the UI: TanStack Query polling (about 3s), not SSE.
- PDF viewing: open stored PDF in the browser's viewer with `#page=N`.
- Verification per task: `npm run build` + `npm run lint` (frontend), `ruff check` (backend), then the task's manual demo.
- Commits only when the user asks.

### Frontend conventions (already established)

- Dark theme only; tokens in `frontend/src/index.css`. Brand orange `#EA580C` for accents/links/rings; button fills use `#C2410C` (AA with white). `warning` is yellow, never orange.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`. Re-apply after any `npx shadcn@4.22.1 add`.
- shadcn ui files import `cn` from `@/lib/utils`. Imports from `"react-router"` (v7). Exact versions (`.npmrc` save-exact).
- Status is always icon + text + color, never color alone. Amounts via `formatINR` / `formatINRShort` in `src/lib/format.ts`.

## Environment notes

- Default Node (20.18) is too old. Prefix node commands with `export PATH=/Users/tarunchauhan/.nvm/versions/node/v22.19.0/bin:$PATH;`.
- The shell tool may hang after node/npm commands. Run them as `<cmd> > /tmp/ts_<step>.log 2>&1 < /dev/null; echo "EXIT=$?" >> /tmp/ts_<step>.log` and read the log.
- `frontend/.agents/tasks/plan.md` is the old scaffold plan and still says `agentic_ai`; the real path is `/Users/tarunchauhan/Documents/projects/tender_scout`.

## Out of scope for v1

Bid submission on portals, competitor/price intelligence, WhatsApp alerts, non-civil domains, payments, starter tenders feed, ML fit ranker (only collect Bid/Skip feedback).

## Change log

- 2026-10-21: Initial requirements captured (civil works, Neon, LangChain-first, no tests, defaults for auth/LLM/beginner mode/hosting).
- 2026-10-21: Backend skeleton: added uvicorn (ASGI server) and redis-py to allowed packages.
- 2026-10-22: Auth switched to Neon Managed Better Auth (user decision). Google sign-in now in scope (Neon shared dev keys). Email verification by 6-digit code. Local dev DB moved to Neon branch `tender_scout_backend`. Self-built auth archived on `archive/own-auth`. Removed pwdlib from allowed packages; added PyJWT[crypto] and `@neondatabase/neon-js`.
- 2026-10-26: Neon dev branch `tender_scout_backend` deleted after its Neon Auth `project_config` went missing ("Project config not found"). Replaced by a fresh branch `dev` (auth URL `ep-muddy-cell-b5gjgdjp`). Added a rule never to touch `neon_auth.project_config` / `jwks`.
