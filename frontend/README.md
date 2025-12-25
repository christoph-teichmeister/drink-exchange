# Drink Exchange Frontend

This directory houses the SvelteKit-based frontend application that powers the user-facing experience of Drink Exchange.
The UI is built with Svelte 4, Skeleton UI components, and Tailwind CSS, and it is bundled via Vite.

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
3. Build for production:
   ```bash
   pnpm build
   ```

## Previewing & Deploying

- Use `pnpm preview` to serve the production build locally.
- Static assets should be placed under `static/`; they are served at the root of the built site.
- The SvelteKit adapter is configured automatically via `svelte.config.js`, so deploy targets that support SvelteKit (
  Vercel, Netlify, etc.) can reuse the existing configuration.

## Tooling

- Linting and formatting leverage ESLint/Prettier for Svelte and TypeScript.
- Tailwind configuration lives in `tailwind.config.cjs`, and PostCSS is configured via `postcss.config.cjs`.
