> Scope: implement ONLY what is required here. No refactors, no extra tooling.
## User Story

As a developer I want a modern frontend setup, so the PWA, live views, and Big Screen can be implemented cleanly.

## Acceptance Criteria

- `frontend/` is a SvelteKit project
- Package manager: pnpm (lockfile committed)
- Dev server runs: http://localhost:5173
- PWA basics integrated:
    - manifest
    - service worker (vite-plugin-pwa or SvelteKit adapter support)
- Env config:
    - API base URL & WS URL per `.env.example`
- 3 routes as skeleton:
    - /user
    - /admin
    - /board
- WS client utility stub (connect/reconnect)
- WS utility binds to `/ws/market/{bar_id}/` and dispatches `prices.update` / `event.*` messages for the
  Big Screen scenario.

### UI Library

- Skeleton UI (Tailwind-based)
- Dark mode active by default
- Theme via CSS variables (market-themed)

### Requirements

- Use AppShell / layout from Skeleton
- Components:
    - Card
    - Table
    - Badge
    - Alert
    - Modal
- Big Screen view:
    - High contrast
    - Large typography
- /board shows a ticker/chart skeleton to represent stock-market-like prices and event displays from the
  architecture doc.

## Tech Notes

- Decide on adapter: `adapter-auto` (MVP OK)
- Eslint/Prettier setup initially or via pre-commit/lint-staged

## Dependencies

- Independent as the frontend foundation; should be available before wiring Docker Compose (`04-docker-compose.md`) and the workspace commands (`05-commands.md`).
