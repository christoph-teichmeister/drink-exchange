> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a developer I want a correctly structured Django project, so features can grow cleanly.

## Acceptance Criteria

- `backend/` contains:
    - Django project `config/` (settings)
    - Apps: e.g. `bars`, `market`, `events`, `api` (initially empty is OK)
- Settings split:
    - base.py, dev.py, prod.py (or env-driven in one file)
- Django 6.* is used, ASGI is enabled (`config/asgi.py`) and `channels` is installed
- `config/asgi.py` + `config/settings` include the channel layer + routing (Redis) and document the
  `market.<bar_id>` bridges.
- DB config via env vars
- pytest setup:
    - pytest.ini
    - pytest-django
    - 1 smoke test (Django starts, DB reachable via migration)
- `uv` setup:
    - pyproject.toml incl. dependencies
    - uv.lock generated and committed to the repo
- Management commands:
    - `uv run python manage.py migrate`
    - `uv run python manage.py runserver` or ASGI run
- Initial apps contain domain model scaffolding (Bar, Drink, Trade, EventDefinition/ActiveEvent) plus admin
  registrations so later flows can plug in.

## Tech Notes

- For ASGI: uvicorn or daphne (decide and document in the README)
- Add `backend/README.md` with dev commands

## Dependencies

- None; this ticket provides the foundational backend structure other tickets rely on.
