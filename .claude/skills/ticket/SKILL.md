---
name: ticket
description: Work one ticket from docs/tickets end to end — branch, implement, verify, commit, open a PR. Use when the user asks to implement, pick up or work on a ticket.
---

# Work a ticket

One ticket = one branch = one PR = one session. Follow `AGENTS.md` throughout.

1. **Pick the ticket.** Use the file the user names (e.g. `docs/tickets/06-trade-impulses.md`). If none is named, list
   `docs/tickets/*.md` (not `archive/`) and ask which one.
2. **Understand it.** Read the ticket, the linked ADRs/architecture sections and the code it touches. Restate the
   acceptance criteria and anything explicitly out of scope. Ask only if a requirement is genuinely ambiguous.
3. **Branch.** From an up-to-date `develop`: `git switch -c <type>/<NN>-<slug>` where `<type>` is `feat`, `fix` or
   `chore` and `<NN>-<slug>` is the ticket file name without `.md`.
4. **Plan.** Outline the change (files, models/migrations, payload changes, tests). Payload changes touch backend and
   frontend in the same PR.
5. **Implement** only what the acceptance criteria require. Write the tests alongside the code.
6. **Verify.** Run the Definition of Done commands from `AGENTS.md` for the parts you touched. Fix failures; do not
   weaken tests.
7. **Commit** with Conventional Commits (`feat(scope): ...`), including lockfiles and migrations.
8. **Push and open a PR** against `develop` using `.github/pull_request_template.md`: link the ticket, list changes,
   give exact "How to verify" steps, note assumptions.
9. **Close the loop.** Move the ticket file to `docs/tickets/archive/` in the same PR once all acceptance criteria are
   met, and report what was done and what (if anything) is left.
