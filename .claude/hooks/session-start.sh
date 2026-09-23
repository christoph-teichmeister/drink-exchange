#!/bin/bash
# Installs backend and frontend dependencies so tests and linters work in Claude Code on the web.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

(cd backend && uv sync --frozen)
(cd frontend && pnpm install --frozen-lockfile)
