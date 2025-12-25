# Agent Contract (Codex)

## Hard Rules

- Only implement what the current ticket requires (no refactors, no tool swaps).
- One ticket = one branch = one PR.
- Always commit lockfiles: uv.lock, pnpm-lock.yaml.
- Update .env.example whenever adding env vars.
- Never use relative imports; always reference modules with their full package paths.
- Wrap new user-facing text with translation utilities (e.g., `gettext_lazy`) so every string stays localizable.
- Keep at most one Python class per file; split domains into separate modules so each file defines a single class.
- Avoid top-level module docstrings or comments; keep module-level explanations inside class docstrings or inline annotations so
  every class is self-describing for junior readers.
- Do not add docstrings to `Meta` inner classes; keep their configuration comments inline instead.
- Do not add `from __future__ import annotations`; rely on explicit typing imports instead.

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
