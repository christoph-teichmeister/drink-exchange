> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a developer I want to build a fast, reproducible backend image, so local usage and CI are stable.

## Acceptance Criteria

- `backend/Dockerfile` exists (multi-stage)
- Uses `uv` for dependency install (lockfile is respected)
- Separate targets: `dev` and `prod` (or via ARG)
- `dev` includes:
    - reload (uvicorn --reload)
    - optional: debug tools
- `prod` includes:
    - no dev deps
    - non-root user
- Build works with docker compose
- Python 3.13-slim as base
- `dev` and `prod` entrypoints start the ASGI server: `uvicorn --reload` vs `uvicorn` (non-root) and can switch
  via ARG.
- Dockerfile uses intermediate layers for `uv sync --frozen` (pyproject/uv.lock COPY) so dependencies get cached.

## Tech Notes

- Install flow (example):
    - COPY pyproject.toml + uv.lock
    - uv sync --frozen
    - COPY source
- Entrypoint stage documents how `uvicorn` is started in dev/prod and how the non-root user + volumes are
  defined.

## Dependencies

- Requires the Django project scaffold, pyproject, and uv.lock that are described in `01-backend-project.md`.
