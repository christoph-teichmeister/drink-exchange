> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a maintainer I want CI for the backend, so PRs are checked automatically.

## Acceptance Criteria

- `.github/workflows/ci-backend.yml`
- Triggers: pull_request, push to main
- Steps:
    - setup python 3.13
    - install uv
    - uv sync --frozen (uses uv.lock)
    - ruff check + ruff format --check
    - pytest
    - start & smoke Celery worker/beat (or run a dedicated health task) so scheduling keeps market ticks/events consistent
    - hit the WebSocket health/market snapshot endpoint to confirm Channels/Redis exchange works
- Services:
    - postgres
    - redis
- Environment vars for the DB connection set in the workflow
- Caching for uv/pip/venv where sensible (if stable)

## Tech Notes

- pytest waits for DB readiness (retry) or uses migrations
- Celery tick/event readiness ensures that the market flow/realtime engine from the architecture (
  `docs/architecture.md:24-83`) runs through.

## Dependencies

- Requires the backend project + Docker setup (`01-backend-project.md`, `03-backend-docker-image.md`, `04-docker-compose.md`) so the CI services can start, and should run after the shared hooks/commands (`06-pre-commit-hooks.md`/`05-commands.md`) to avoid duplication.
