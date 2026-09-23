> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a developer I want to start the whole system locally via docker compose, so everyone can develop
reproducibly.

## Acceptance Criteria

- docker-compose.yml starts:
    - postgres (persistent volume)
    - redis (persistent volume optional)
    - backend-web (Django ASGI)
    - backend-worker (Celery worker)
    - backend-beat (Celery beat)
- Compose ensures web/worker/beat only start once Postgres + Redis are healthy (depends_on +
  healthchecks / wait-for scripts).
- Backend is reachable at http://localhost:8000
- `make up` / `docker compose up` works without manual steps
- Healthchecks for postgres/redis (and optionally web)
- .env.example exists (DB creds, secret key, debug, allowed hosts)
- Volumes: postgres-data, optional redis-data

## Tech Notes

- web uses ASGI (daphne/uvicorn), not WSGI
- worker/beat share the same image/build context
- dependencies: web waits for postgres + redis
- Redis serves as the Channels channel layer → Compose should ensure that WebSocket traffic (market.<bar_id>)
  works after healthchecks.

## Dependencies

- Backend source and dependency config need to exist (see `01-backend-project.md`), and the backend image (`03-backend-docker-image.md`) must be buildable.
- Frontend assets or services (see `02-frontend-setup.md`) should be in place before wiring up Docker Compose so `make up` works end-to-end.
