> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a maintainer I want CI for the frontend, so builds don't break.

## Acceptance Criteria

- `.github/workflows/ci-frontend.yml`
- Steps:
-    - setup node (22)
    - enable pnpm + cache
    - pnpm install --frozen-lockfile
    - pnpm lint (if present)
    - pnpm test (optional, if there are no tests yet: skip with TODO)
    - pnpm build
- pnpm build also produces PWA assets (manifest + service worker) so the architecture requirements (
  `docs/architecture.md:5-50`) are verified in CI.

## Tech Notes

- Define lint/test commands in package.json, even if a stub initially
- CI ensures manifest + service worker are built (PWA basics from the architecture).

## Dependencies

- Depends on the frontend skeleton (`02-frontend-setup.md`) and the shared command/hook setup (`05-commands.md`, `06-pre-commit-hooks.md`) so the workflow can run actual scripts.
