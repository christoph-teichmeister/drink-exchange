# Drink Exchange

A PWA that turns a bar's drink menu into a live stock market: prices move every few seconds, random market events
(boom, crash, focus) shake things up, and a big-screen board shows tickers and charts in real time.

- **Backend:** Django 6, Channels (ASGI/WebSockets), Celery worker + beat, Postgres, Redis, managed with `uv`.
- **Frontend:** SvelteKit (Svelte 5), Tailwind CSS, PWA, managed with `pnpm`.

Architecture and design decisions: [`docs/architecture.md`](docs/architecture.md), [`docs/adr/`](docs/adr/).
Contributor and agent guidelines: [`AGENTS.md`](AGENTS.md).

## Prerequisites

- Docker with Docker Compose v2
- Python 3.13 and [`uv`](https://docs.astral.sh/uv/)
- Node 22 with Corepack (pnpm version is pinned in `frontend/package.json`)
- GNU gettext for the German backend catalog (`brew install gettext` / `apt install gettext`); the Docker images
  bring their own
- Optional: [`pre-commit`](https://pre-commit.com/)

## Quickstart

```bash
cp .env.example .env
make up                      # postgres, redis, backend, celery worker/beat, frontend
```

The backend container migrates and seeds development data on start (`manage.py ensure_dev_data`: three demo bars,
drinks, events and a superuser `admin` / `admin`, overridable via `DJANGO_DEV_SUPERUSER_*`).

- Frontend: <http://localhost:5173> — log in, pick a bar, open the board at `/board/<bar-slug>`
- Django admin: <http://localhost:8000/admin/>

To work on one side outside Docker:

```bash
docker compose up -d postgres redis
make messages-compile        # German backend messages; .mo files are not committed
cd backend && uv sync && uv run python manage.py migrate && uv run uvicorn config.asgi:application --reload
cd frontend && pnpm install && pnpm dev
```

## Make targets

| Target | What it does |
| --- | --- |
| `make up` / `make down` | Start (with build) / stop the compose stack |
| `make logs` / `make ps` | Follow logs / list services |
| `make backend-test` / `make backend-lint` | pytest / ruff |
| `make frontend-dev` / `make frontend-lint` / `make frontend-test` | Vite dev server / ESLint / Vitest |
| `make celery-worker-start` / `make celery-beat-start` (and `-stop`) | Control the Celery services |
| `make ws-health` | Probe the market WebSocket handshake |
| `make messages` / `make messages-compile` / `make messages-check` | Update / compile / verify the German backend catalog |

## Environment variables

All variables live in `.env` (template: `.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | insecure placeholder | Required in production; `config.settings.prod` refuses to start with the placeholder |
| `DJANGO_DEBUG` | `true` (dev) | Debug mode for `config.settings.dev`; always off in prod |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts; also used to validate the WebSocket `Origin` |
| `DATABASE_URL` | SQLite | Database URL (compose uses Postgres) |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Channel layer and tick locks |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | `REDIS_URL` | Celery |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,…` | Origins allowed to call the API with credentials |
| `DJANGO_LOG_LEVEL` | `INFO` | Log level |
| `DJANGO_DEV_SUPERUSER_NAME` / `_EMAIL` / `_PASSWORD` | `admin` / … / `admin` | Dev superuser from `ensure_dev_data` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | – | Prod: trusted origins for CSRF |
| `DJANGO_SECURE_SSL_REDIRECT` | `true` | Prod: redirect HTTP to HTTPS |
| `DJANGO_SECURE_HSTS_SECONDS` / `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` | `31536000` / `false` | Prod: HSTS |
| `DEV_FIXTURES_ENABLED` | `1` | Container: seed dev data on start (dev settings only) |
| `DJANGO_MIGRATE_ON_START` | `1` | Container: run migrations and seeding on start (set to `0` for Celery containers) |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | API base URL used by the browser |
| `VITE_API_INTERNAL_BASE_URL` | same | API base URL used during SSR (compose: `http://backend:8000/api`) |
| `VITE_WS_BASE_URL` | `ws://localhost:8000` | WebSocket base URL |

## Testing and CI

See the Definition of Done in [`AGENTS.md`](AGENTS.md#definition-of-done) for the exact commands. CI
(`.github/workflows/`) runs on every PR and on pushes to `develop`:

- **Backend CI:** German translation check (`scripts/check-translations.sh`), migrations, `manage.py check`, pytest against Postgres + Redis, and a WebSocket probe with Celery
  worker/beat running.
- **Frontend CI:** lint, type check, unit tests, build and a PWA output check.
- **pre-commit:** Ruff, ESLint, Prettier, markdownlint and whitespace fixers (`pre-commit install` to run them locally).

## Working with Claude Code

The repo is set up for agentic development:

- [`AGENTS.md`](AGENTS.md) holds conventions, commands and the Definition of Done; [`CLAUDE.md`](CLAUDE.md) imports it.
- `.claude/settings.json` pre-approves routine commands; `.claude/hooks/session-start.sh` installs dependencies in
  Claude Code on the web sessions.
- `/ticket` (`.claude/skills/ticket/`) works one ticket from [`docs/tickets/`](docs/tickets/README.md) end to end.

## License

[MIT](LICENSE)
