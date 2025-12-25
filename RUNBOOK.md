# Runbook: Codex CLI + GitHub MCP

## Pro Ticket

1) GitHub MCP: Issue öffnen → Branch erstellen (chore/<ticket>-<slug>)
2) Lokal: `git checkout <branch>`
3) In root: `codex` starten
4) Prompt aus `prompts/<ticket>.md` copy-pasten
5) Codex führt aus + commit + push
6) GitHub MCP: PR erstellen, Issue verlinken, CI prüfen, merge

## Done-Kriterien

- AGENTS.md eingehalten
- Lokale Checks grün (siehe AGENTS.md)
- PR enthält "Changes" + "How to verify"
