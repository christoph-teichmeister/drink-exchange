# Drink Exchange Backend

This directory contains the Django backend service with Channels/ASGI, managed via `uv`.

## Quickstart

1. Prepare SSL/Environment (see `/ .env.example`):
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   cd backend
   uv sync --frozen
   ```
3. Apply database migrations and start the server:
   ```bash
   uv run python manage.py migrate
   uv run uvicorn config.asgi:application --reload
   ```

Alternatively, use `uv run python manage.py runserver` if you prefer the Django development server.

## ASGI & Channels

- ASGI server: `uvicorn config.asgi:application` (ASGI is used so Channels and WebSockets run natively).
- The channel layer defined in `config/settings` uses `REDIS_URL` and maps market events to groups like
  `market.<bar_id>`.
- The `MarketConsumer` in `market/consumers.py` bridges WebSocket connections to those groups.

## Environment

The following variables should be set (see `.env.example`):

| Variable               | Description                                                        |
|------------------------|--------------------------------------------------------------------|
| `DJANGO_SECRET_KEY`    | Django secret key (a secure key must be configured in production). |
| `DATABASE_URL`         | e.g. `sqlite:///db.sqlite3` or `postgresql://user:pass@host/db`.   |
| `REDIS_URL`            | e.g. `redis://127.0.0.1:6379/0` (channel layer backend).           |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hosts.                             |
| `DJANGO_DEBUG`         | `true` or `false` to toggle debug mode.                            |
