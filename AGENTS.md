# Agent Contract (Codex)

## Hard Rules

- Only implement what the current ticket requires (no refactors, no tool swaps).
- One ticket = one branch = one PR.
- Always commit lockfiles: uv.lock, pnpm-lock.yaml.
- Update .env.example whenever adding env vars.
- Never use relative imports; always reference modules with their full package paths.

## Definition of Done (run what’s relevant)

### Backend

- cd backend && uv sync --frozen
- cd backend && uv run ruff check .
- cd backend && uv run ruff format --check .
- cd backend && uv run pytest
- cd backend && uv run python manage.py migrate

### Frontend

- cd frontend && pnpm install --frozen-lockfile
- cd frontend && pnpm build

### Docker

- docker compose build
- docker compose up -d
- docker compose ps
