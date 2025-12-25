# Agent Contract

## Scope Rules

- 1 Issue/Ticket = 1 Branch = 1 PR
- No refactors, no tool swaps, no extra features outside acceptance criteria
- Lockfiles are mandatory: uv.lock, pnpm-lock.yaml
- Always update .env.example if new env vars are introduced

## Tech Choices (fixed)

- Backend: Django (ASGI) + uv + Postgres + Redis + Celery
- Frontend: SvelteKit + pnpm + Skeleton UI + Tailwind
- Lint/format: ruff + ruff-format; frontend eslint+prettier if present
- CI: GitHub Actions

## Commands to run before DONE

### Backend

- cd backend && uv sync --frozen
- cd backend && uv run ruff check .
- cd backend && uv run ruff format --check .
- cd backend && uv run pytest
- cd backend && uv run python manage.py migrate

### Frontend

- cd frontend && pnpm install --frozen-lockfile
- cd frontend && pnpm lint (if configured)
- cd frontend && pnpm build

### Docker

- docker compose build
- docker compose up -d
- docker compose ps

## PR Requirements

- Describe changed files
- Provide verification steps
- Keep diffs minimal
