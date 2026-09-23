> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a team we want automatic checks before every commit, so code quality stays stable.

## Acceptance Criteria

- `.pre-commit-config.yaml` in the repo
- Python hooks:
    - ruff (lint)
    - ruff-format (format)
    - detect-private-key, end-of-file-fixer, trailing-whitespace
- Optional (if feasible without pain):
    - mypy (only if a baseline config exists)
- Frontend hooks:
    - eslint (if set up)
    - prettier (if set up)
- Documentation in the README: `pre-commit install`
- The hooks cover both `backend/` (via `backend/pyproject.toml`) and `frontend/` PNPM tools, so the same
  rules from the architecture (Python + PWA) apply.
- Markdown files are checked with `markdownlint`, so the documentation stays consistent.

## Tech Notes

- ruff as the single source of truth (instead of black/isort)
- Config in `backend/pyproject.toml`

## Dependencies

- Needs the backend project (`01-backend-project.md`) and frontend setup (`02-frontend-setup.md`) to exist so the hooks
  target real files, and ideally should run after the helper commands (`05-commands.md`) are in place.
