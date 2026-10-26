# TenderScout dev commands. Run `make help` to list targets.

# The frontend needs Node 22; this machine's default Node (20.18) is too old.
# Change this path if Node 22 lives elsewhere on your machine.
NODE22_PATH := PATH=/Users/tarunchauhan/.nvm/versions/node/v22.19.0/bin:$$PATH
# openapi-typescript is run with npx at a pinned version (not a package.json dependency).
OPENAPI_TS_VERSION := 7.13.0
API_URL ?= http://localhost:8000
QUEUES := default,ingestion,documents,ai,notifications

.DEFAULT_GOAL := help
.PHONY: help up down logs install dev worker beat migrate revision lint format types fe

help: ## List available targets
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-10s %s\n", $$1, $$2}'

up: ## Start Postgres (pgvector), Redis and Mailpit in Docker
	docker compose up -d

down: ## Stop the Docker services (data volume is kept)
	docker compose down

logs: ## Follow the Docker service logs
	docker compose logs -f

install: ## Install backend (uv sync) and frontend (npm install) dependencies
	cd backend && uv sync
	cd frontend && $(NODE22_PATH) npm install

dev: ## Run the API with auto-reload on http://localhost:8000
	cd backend && uv run uvicorn app.main:app --reload --port 8000

worker: ## Run a Celery worker on all queues
	cd backend && uv run celery -A app.workers.celery_app worker -Q $(QUEUES) -l info

beat: ## Run Celery Beat (scheduled jobs)
	cd backend && uv run celery -A app.workers.celery_app beat -l info

migrate: ## Apply database migrations (alembic upgrade head)
	cd backend && uv run alembic upgrade head

revision: ## Autogenerate a migration: make revision m="add users"
	cd backend && uv run alembic revision --autogenerate -m "$(m)"

lint: ## Lint backend (ruff) and frontend (eslint)
	cd backend && uv run ruff check .
	cd frontend && $(NODE22_PATH) npm run lint

format: ## Format backend (ruff format) and frontend (prettier)
	cd backend && uv run ruff format .
	cd frontend && $(NODE22_PATH) npm run format

types: ## Generate frontend/src/types/api.ts from the running API's OpenAPI schema
	cd frontend && $(NODE22_PATH) npx --yes openapi-typescript@$(OPENAPI_TS_VERSION) $(API_URL)/openapi.json -o src/types/api.ts

fe: ## Run the frontend dev server on http://localhost:5173
	cd frontend && $(NODE22_PATH) npm run dev
