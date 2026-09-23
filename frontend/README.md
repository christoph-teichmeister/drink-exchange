# Drink Exchange Frontend

This directory houses the SvelteKit-based frontend application that powers the user-facing experience of Drink Exchange.
The UI is built with Svelte 5 (runes mode) and Tailwind CSS 4, bundled via Vite, and served by `@sveltejs/adapter-node`.

## Quickstart

1. Install dependencies:
   ```bash
   cd frontend
   pnpm install --frozen-lockfile
   ```
2. Start the dev server (listens on `0.0.0.0:5173` by default):
   ```bash
   pnpm dev
   ```
3. Build and run the production server:
   ```bash
   pnpm build
   PORT=3000 ORIGIN=http://localhost:3000 pnpm start
   ```

## Scripts

| Script              | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `pnpm lint`         | ESLint (flat config, Svelte + TypeScript rules) |
| `pnpm format`       | Format all files with Prettier                  |
| `pnpm format:check` | Verify formatting                               |
| `pnpm check`        | `svelte-check` type and a11y checks             |
| `pnpm test`         | Vitest unit tests                               |
| `pnpm build`        | Production build into `build/`                  |

## Configuration

- `VITE_API_BASE_URL` / `VITE_WS_BASE_URL`: backend URLs as seen by the browser (inlined at build time).
- `VITE_API_INTERNAL_BASE_URL`: backend URL used by the SvelteKit server during SSR (read at runtime,
  falling back to the build-time value). The user's `cookie` and `accept-language` headers are forwarded
  only to this URL (see `src/lib/server/forward-headers.ts`).
- adapter-node runtime variables such as `PORT`, `HOST` and `ORIGIN` apply to `pnpm start`.

## Tooling

- Tailwind is configured CSS-first in `src/lib/styles/app.css` (`@theme`), loaded via `@tailwindcss/vite`.
- The PWA consists of `static/manifest.webmanifest` and a single native SvelteKit service worker
  (`src/service-worker.ts`) that precaches build assets and static files only; HTML, API and WebSocket
  traffic always goes to the network.

## Big Screen Board

- Start the dev server (`pnpm dev`) and open `http://localhost:5173/board/main-stage` to view the trading-floor board.
- The board uses `GET /api/bars/<bar_id>/market/` for the initial snapshot and `/ws/market/<bar_id>/` for live data.
- The connection state (connecting, connected, reconnecting, offline, no access) is shown on the board; while the
  live connection is down, prices are dimmed and marked with the time of the last update.
