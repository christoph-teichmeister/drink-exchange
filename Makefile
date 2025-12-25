.PHONY: up down logs ps \
  backend-shell backend-test backend-lint \
  frontend-dev frontend-test frontend-lint \
  celery-worker-start celery-worker-stop \
  celery-beat-start celery-beat-stop \
  ws-health

DOCKER_COMPOSE ?= docker compose

up:
\t$(DOCKER_COMPOSE) up --build

down:
\t$(DOCKER_COMPOSE) down

logs:
\t$(DOCKER_COMPOSE) logs --follow

ps:
\t$(DOCKER_COMPOSE) ps

backend-shell:
\tcd backend && uv run python manage.py shell

backend-test:
\tcd backend && uv run pytest

backend-lint:
\tcd backend && uv run ruff check .

frontend-dev:
\tcd frontend && pnpm dev --host 0.0.0.0 --port 5173

frontend-test:
\tcd frontend && pnpm run build

frontend-lint:
\tcd frontend && pnpm exec eslint src static --max-warnings=0

celery-worker-start:
\t$(DOCKER_COMPOSE) up -d celery-worker

celery-worker-stop:
\t$(DOCKER_COMPOSE) stop celery-worker

celery-beat-start:
\t$(DOCKER_COMPOSE) up -d celery-beat

celery-beat-stop:
\t$(DOCKER_COMPOSE) stop celery-beat

ws-health:
\tpython scripts/ws-health.py
