# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Start non-trivial work in plan mode: read the ticket, outline the change, then implement.
- Verify before you claim done: run the Definition of Done commands from `AGENTS.md` for the parts you touched and
  report their actual output. If a check fails, say so; never skip or weaken a test to get green.
- Use the `/ticket` skill (`.claude/skills/ticket/SKILL.md`) to work a ticket from `docs/tickets/` end to end.
- `.claude/settings.json` pre-approves the routine lint/test/build commands and installs dependencies on session start
  in Claude Code on the web (`.claude/hooks/session-start.sh`). Personal overrides go into
  `.claude/settings.local.json` (git-ignored).
- The backend test suite needs no services (SQLite + in-memory channel layer). For WebSocket or Celery work, run
  Postgres and Redis (`docker compose up -d postgres redis`) and set `DATABASE_URL` / `REDIS_URL` accordingly.
- Keep `AGENTS.md` the single source of truth: when you learn a new project convention, add it there, not here.
