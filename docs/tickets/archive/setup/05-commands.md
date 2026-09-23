> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a developer I want unified commands, so setup and CI run identically locally.

## Acceptance Criteria

- Root `README.md` contains a quickstart:
    - prerequisites
    - copy .env.example -> .env
    - docker compose up
    - backend migrate/superuser
- Root `Makefile` (or justfile) with targets:
    - up/down/logs/ps
    - backend-shell/backend-test/backend-lint
    - frontend-dev/frontend-test/frontend-lint
- `Makefile` also contains targets for starting/stopping `celery worker` and `celery beat` in the Compose
  setup, as well as a `ws-health` probe against the market WebSocket endpoint.
- `scripts/` optional for helpers (db reset, seed)

## Tech Notes

- Keep it minimal, no fancy scaffolding

## Dependencies

- Relies on the services defined in `04-docker-compose.md`, plus backend/frontend targets from `01-backend-project.md`/`02-frontend-setup.md`, to make the commands actually work.
