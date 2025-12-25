# Drink Exchange

This repository bootstraps the Drink Exchange platform with a full-stack Django/Channels backend, a SvelteKit frontend,
and the tooling needed to keep both environments aligned locally and in CI.

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
- CI workflows live under `.github/workflows` (see `07-ci-backend.md`, `08-ci-frontend.md`, `09-pre-commit-workflow.md`
  for descriptions).

## Coding Guidelines

- Prefer absolute imports everywhere; do not rely on relative imports so cross-module references stay explicit and
  consistent.
- Do not add `from __future__ import annotations`; the project keeps annotation evaluation standard and relies on
  explicit typing imports.
- Wrap user-facing strings with translation helpers (`gettext_lazy`) to keep the UI ready for localization.
- Keep at most one Python class per file; structure domains so each module defines a single class.
- Treat admin modules the same way: each `ModelAdmin` lives in its own file, the app-level `admin/__init__.py` imports those classes directly (no `importlib.import_module`) and re-exports them via an explicit `__all__ = ["ActiveEventAdmin", "EventDefinitionAdmin"]` so Django still registers them while the single-class-per-file rule is preserved.
- Initialize every package with an explicit `__all__` declaration (e.g., `__all__ = ["ActiveEvent", "EventDefinition"]`) inside `__init__.py`, even if the module only wires admin imports, so the exports stay predictable for importers.
- Derive every business model from `ambient_toolbox.models.CommonInfo` and pair the admin class with `CommonInfoAdminMixin`, while leaving `CurrentRequestMiddleware` enabled so ownership fields (`created_by`, `created_at`, `lastmodified_by`, `lastmodified_at`) stay accurate and the admin keeps those fields read-only unless a subclass overrides `get_user_obj()` or sets `ALWAYS_UPDATE_FIELDS = False` (see the [Ambient Toolbox CommonInfo docs](https://ambient-toolbox.readthedocs.io/en/latest/features/models.html#commoninfo) for the available audit fields and helpers).
- Avoid module docstrings or explanatory comments at the top of files; rely on class docstrings and inline
  notes within each class so new contributors can understand the intent immediately.
- Do not add docstrings to `Meta` inner classes; their configuration should be documented using inline comments if needed.

## Next Steps

Once dependencies are in place, follow `docs/tickets/setup/ORDER.md` to tackle the remaining setup tickets in sequence.
Make sure `pre-commit` and CI workflows run after the local helper commands are working.
