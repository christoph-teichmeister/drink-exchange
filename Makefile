.PHONY: up down logs ps \
  backend-shell backend-test backend-lint \
  frontend-dev frontend-test frontend-lint \
  celery-worker-start celery-worker-stop \
  celery-beat-start celery-beat-stop \
  ws-health

DOCKER_COMPOSE ?= docker compose

up:
	$(DOCKER_COMPOSE) up --build

down:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs --follow

ps:
	$(DOCKER_COMPOSE) ps

backend-shell:
	cd backend && uv run python manage.py shell

backend-test:
	cd backend && uv run pytest

backend-lint:
	cd backend && uv run ruff check . && uv run ruff format --check .

frontend-dev:
	cd frontend && pnpm dev --host 0.0.0.0 --port 5173

frontend-test:
	cd frontend && pnpm test

frontend-lint:
	cd frontend && pnpm lint

celery-worker-start:
	$(DOCKER_COMPOSE) up -d celery-worker

celery-worker-stop:
	$(DOCKER_COMPOSE) stop celery-worker

celery-beat-start:
	$(DOCKER_COMPOSE) up -d celery-beat

celery-beat-stop:
	$(DOCKER_COMPOSE) stop celery-beat

ws-health:
	python scripts/ws-health.py
