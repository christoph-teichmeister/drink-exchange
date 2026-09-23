> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a maintainer I want the same checks enforced in CI as locally, so nothing slips through.

## Acceptance Criteria

- Workflow `.github/workflows/pre-commit.yml`
- Runs: pre-commit on changed files (or full)
- Uses caching
- Fails if hooks fail
- Clarifies whether the workflow runs only on changed files or a full run per push, and how that aligns with
  the backend/frontend hooks (`06-pre-commit-hooks.md`) so no parallel check is needed.

## Tech Notes

- Alternative: run the same checks in backend/frontend CI and drop the pre-commit workflow

## Dependencies

- Run this after the hooks (`06-pre-commit-hooks.md`) and the backend/frontend CI workflows (`07-ci-backend.md`, `08-ci-frontend.md`) exist so the overlap and caching strategy are clear.
