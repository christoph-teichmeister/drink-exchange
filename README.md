# Drink Exchange

This repository bootstraps the Drink Exchange platform with a full-stack Django/Channels backend, a SvelteKit frontend, and the tooling needed to keep both environments aligned locally and in CI.

## Prerequisites

- Docker & Docker Compose (v2+) – for containers/services.
- Python 3.13 / `uv` (used by backend tooling and CI).
- Node 22 and pnpm (for SvelteKit).
- `codex` CLI if you plan to run the scripted ticket workflow.

## Quickstart

```bash
cp .env.example .env
docker compose up --build
# in a new shell:
cd backend
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

`make up` / `make down` and the other helpers defined in `05-commands.md` mirror these steps for convenience.

## Project Layout

- `backend/`: Django 6 with Channels, ASGI, pytest, uv-managed dependencies, and Celery worker/beat.
- `frontend/`: SvelteKit + Skeleton UI, pnpm-managed, PWA basics, WebSocket utilities for the big-screen views.
- `docs/`: Architecture notes, ticket backlog, and setup order (`docs/tickets/setup/ORDER.md`).
- `scripts/`: Helper scripts such as `codex_start_process.sh`.

## Testing & CI

- Backend: `uv sync --frozen`, `uv run ruff`, `uv run pytest`.
- Frontend: `pnpm lint`, `pnpm build`.
- CI workflows live under `.github/workflows` (see `07-ci-backend.md`, `08-ci-frontend.md`, `09-pre-commit-workflow.md` for descriptions).

## Coding Guidelines

- Prefer absolute imports everywhere; do not rely on relative imports so cross-module references stay explicit and consistent.
- Wrap user-facing strings with translation helpers (`gettext_lazy`) to keep the UI ready for localization.
- Keep at most one Python class per file; structure domains so each module defines a single class.

## Next Steps

Once dependencies are in place, follow `docs/tickets/setup/ORDER.md` to tackle the remaining setup tickets in sequence. Make sure `pre-commit` and CI workflows run after the local helper commands are working.
