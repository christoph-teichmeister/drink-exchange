> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User-Story

Als Maintainer möchte ich die gleichen Checks wie lokal im CI erzwingen, damit nichts durchrutscht.

## Akzeptanzkriterien

- Workflow `.github/workflows/pre-commit.yml`
- Runs: pre-commit on changed files (oder full)
- Nutzt caching
- Fail wenn hooks failen
- Klärt, ob Workflow nur geänderte Dateien oder ein Full run pro push ausführt und wie sich das auf die
  backend-/frontend-hooks (`06-pre-commit-hooks.md`) abstimmt, damit kein paraleller Check nötig ist.

## Tech Notes

- Alternative: In backend/frontend CI die gleichen Checks laufen lassen und pre-commit workflow weglassen

## Dependencies

- Run this after the hooks (`06-pre-commit-hooks.md`) and the backend/frontend CI workflows (`07-ci-backend.md`, `08-ci-frontend.md`) exist so the overlap and caching strategy are clear.
