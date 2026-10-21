# TenderScout implementation plan

Rules, stack and conventions live in `.kiro/steering/project.md`. Read it before starting any task.
Status: `[ ]` not started, `[~]` in progress, `[x]` done. Update the status and add a one-line note when a task finishes or changes.
Every task is verified by `npm run build` + `npm run lint` (frontend), `ruff check` (backend), and its Demo. No tests.

## Phase 0: Foundation

- [ ] **1. Repo skeleton and frontend close-out**
  - Fix review items: mobile Sheet `onCloseAutoFocus` after anchor links; soften FAQ data-safety copy.
  - Change the home sample card to a fictional CPWD civil works tender.
  - Root `docker-compose.yml` (`pgvector/pgvector` Postgres, Redis, Mailpit), `Makefile` (`up`, `down`, `dev`, `worker`, `beat`, `types`, `ingest`).
  - Demo: `make up` starts services; home page shows the civil works example.

- [ ] **2. Backend scaffold**
  - `backend/` with uv; pydantic-settings (pooled + direct DB URLs, asyncpg statement-cache flag); async SQLAlchemy; Alembic on direct URL, first migration enables `vector`; `GET /health`; CORS for Vite; `make types` writes `frontend/src/types/api.ts`.
  - Demo: `curl :8000/health` → db ok, redis ok.

- [ ] **3. Auth and app shell**
  - `users`, `companies`, `memberships`; pwdlib argon2; access + refresh JWT in httpOnly cookies + CSRF header; email verify + reset via Mailpit; login rate limit; all queries scoped by `company_id`.
  - Frontend: TanStack Query; real `/login`, `/signup`, `/verify`, `/reset`; `RequireAuth`; `AppShell` sidebar (Dashboard, Tenders, Documents, Pipeline, Settings); empty dashboard.
  - Demo: sign up → Mailpit link → log in → dashboard → log out.

## Phase 1: Company side

- [ ] **4. Onboarding and company profile**
  - Wizard: name, entity type, states, work types, registration class, "Bid before?" (`beginner` flag). Settings page to edit.
  - Demo: new user completes setup and sees it in Settings.

- [ ] **5. Document vault**
  - `Storage` interface (local private disk); type/size checks; checksum dedupe; `documents` table (type, status, expiry); one-time consent; Celery `documents` queue (Uploaded → Processing → Needs review / Failed).
  - My Documents page: drag-and-drop, list, status chips polling every 3s, delete.
  - Demo: upload a PDF and watch its status change without refresh.

- [ ] **6. LangChain AI core + Document Agent (classify, extract, validate)**
  - `ai/models.py`: `init_chat_model` small/strong, `init_embeddings`, Redis `set_llm_cache`, LangSmith env vars.
  - `DoclingLoader` page-aware chunks; save per-page text.
  - Graph: classify → extract (schema registry per doc type, page per field) → validate (GSTIN/PAN/Udyam, dates, amounts; retry max 2).
  - UI: detected type (editable) + fields with "p.X".
  - Demo: completion certificate → type + work name, value, dates with sources; run visible in LangSmith.

- [ ] **7. Human review, company facts, work embeddings**
  - LangGraph Postgres checkpointer + `interrupt`; review screen to confirm/edit; resume on confirm.
  - Build `company_facts` (turnover per FY, works, registrations, certificates + validity); add works to `company_works` PGVectorStore with `company_id`.
  - Dashboard profile completeness %.
  - Demo: edit a value, confirm, see "Profile 60% complete" with works listed.

- [ ] **8. Readiness checklist and expiry warnings**
  - `readiness_rules.yaml` (PAN, GST, Udyam, DSC, portal enrolment, registration, ITR, solvency, EPF/ESIC; why, how, time, official link).
  - Readiness score; daily Beat job for 30/15/1-day expiry warnings; dashboard readiness card.
  - Demo: beginner sees "40% ready, next: Udyam"; expiring solvency shows a warning.

## Phase 2: Tender side

- [ ] **9. Portal research, tender model, CPPP ingestion**
  - `docs/research/portals.md`: CPPP, GeM, one state portal (robots.txt/terms, captcha points, link stability, document download, corrigenda); CPWD eligibility rules; MSE policy for works; Neon region + storage options.
  - Decision point: captcha-gated documents → store links only.
  - `tenders` (unique `portal, ref_id`; `source_url`, `document_urls`, `last_checked_at`, `content_hash`); CPPP adapter (`WebBaseLoader` + BeautifulSoup, rate limit, User-Agent, idempotent upsert); `ingestion_runs`; Beat 02:00 IST + `make ingest`.
  - Tenders page: "View on CPPP ↗" (new tab, `rel="noopener noreferrer"`), copy ID, last checked.
  - Demo: `make ingest` loads real CPPP tenders with working links.

- [ ] **10. Domain classifier (civil works only)**
  - Export ~600 titles, small LLM pre-labels, human corrects CSV; logistic regression on `init_embeddings` vectors; print precision/recall (target ≥0.9 recall); save `domain_clf_v1.joblib`; keyword fallback; wire into ingestion.
  - Demo: run prints "kept X / dropped Y"; list shows only civil works.

- [ ] **11. Tender documents and key-section embeddings**
  - Download docs for in-domain tenders (where allowed); `DoclingLoader`; tag sections (eligibility, scope, dates, EMD, similar-work definition); embed key sections into `tender_chunks` PGVectorStore with hybrid search; delete PDF copies N days after close, keep links.
  - Detail page "Open PDF" → `#page=N`, labelled "Copy for reference, verify on the official portal".
  - Demo: Open PDF lands on the right page.

- [ ] **12. Tender Analyst graph**
  - find_sections (hybrid, `tender_id`) → extract_rules (strong, rule types from steering) → validate (retry max 2) → summarize; save `tender_rules` with `schema_version`; auto-run after task 11.
  - Detail page: summary, dates, EMD, rules table with "Source p.X".
  - Demo: CPWD tender shows similar-works rule with p.12 link that opens page 12.

## Phase 3: Matching

- [ ] **13. Checkers + Eligibility Team part 1**
  - SQL prefilter (state, work type, deadline, value); plain-code `@tool` checkers (avg turnover, solvency amount + validity on bid date, registration class order, compliance validity, bid capacity if specified).
  - Graph: supervisor → `Send` to Financial + Compliance → `rule_results` with `{tender: page, company: document + field}`.
  - Demo: turnover and solvency ✅/❌ with both sources.

- [ ] **14. Eligibility Team part 2**
  - Experience Matcher (`company_works` retriever + LLM judge, math in code), Benefits Agent, Auditor (missing citation → ❓), Gap Advisor; fit score; checklist (attach / missing).
  - UI: verdict panel (reuse `VerdictRing`), Checklist tab, "Why can't I bid?".
  - Demo: "Bid: 7 of 9 met"; ❌ explains the fix; checklist lists documents.

- [ ] **15. Automatic matching, feed, dashboard**
  - Queue matching after tender rules saved or company facts change (prefiltered only); feed API (cursor pagination, filters, sort by fit); dashboard counts, deadlines, expiring docs; Bid/Skip feedback.
  - Demo: after `make ingest`, dashboard shows new matches and a sorted feed.

## Phase 4: Engagement

- [ ] **16. Chat with a tender**
  - Prebuilt tool-calling agent (`search_tender`, `get_rules`, `get_my_documents`, `get_verdict`); checkpointer threads per user+tender; embed full tender on first chat; "couldn't find this" rule; clickable "p.X"; daily message limit; glossary hover hints (static JSON).
  - Demo: "Is there a site visit?" → answer citing p.7 with a working link.

- [ ] **17. Pipeline, change detection, email alerts**
  - `pipeline_items` (Interested → Preparing → Submitted → Won/Lost); corrigendum detection via hash → reprocess, record changes, "Updated" banner; notifications worker (daily digest, corrigendum, deadline 7/2 days, document expiry); on/off preferences.
  - Demo: save + move a tender; digest and reminder arrive in Mailpit.

- [ ] **18. More portals**
  - `PortalAdapter` interface; GeM via `PlaywrightURLLoader` (only if task 9 allows) + one state NIC portal; Celery retries with backoff; per-portal rate limits.
  - Demo: feed shows tenders from 3 portals with correct links.

## Phase 5: Delivery

- [ ] **19. Privacy essentials**
  - Consent record in Settings; "Delete my account" removes rows, vectors, files; privacy page; LLM no-retention; security headers; strict CORS.
  - Demo: deleted test account leaves no files or vectors.

- [ ] **20. Cloud deployment**
  - Neon `main` + `dev` branches, migrations on deploy (direct URL); API + worker + Beat on a container host (pick Render/Railway/Fly then); managed Redis; cloud `Storage` (Neon object storage if S3-compatible, else Cloudflare R2); static frontend host; HTTPS; secrets in host manager; README deploy steps.
  - Demo: live link; 02:00 IST ingestion runs; morning digest arrives.

## Future (not v1)

Starter tenders feed, LightGBM fit ranker from Bid/Skip feedback, WhatsApp alerts, competitor/price intelligence, more domains (IT hardware next), Google sign-in.

## Notes log

- 2026-10-21: Plan created. No tasks started.
- 2026-10-21: Task 3 frontend part (branch `feat/auth-screens`): `/login` and `/signup` screens with `AuthLayout`, TanStack Query mutations, `login`/`signup` + `ApiError` in `api.ts`, mock mode (`VITE_USE_MOCKS`), placeholder `/dashboard`, `/forgot-password`, `/terms`, `/privacy`. Backend auth, `/verify`, `/reset`, `RequireAuth`, `AppShell` still to do.
