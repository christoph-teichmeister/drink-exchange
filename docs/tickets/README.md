# Tickets

New work is described as one ticket per file directly in `docs/tickets/`, named `NN-short-slug.md` (e.g.
`10-price-alerts.md`). The convention is: one ticket = one branch = one PR = one agent session.

Completed tickets are moved out of the active list into `archive/` (`docs/tickets/archive/setup/` and
`docs/tickets/archive/features/`) once their work has been implemented, so the active folder only ever shows
work that is still open.

## Ticket template

Use whichever of the following sections fit the ticket; the existing archived tickets show the pattern:

```markdown
> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a <role> I want <capability>, so <benefit>.

## Acceptance Criteria

- ...

## Tech Notes

- ...

## Dependencies

- ...
```

For tickets without a user-facing story (e.g. an implementation task written as an instruction), a simpler shape
also works:

```markdown
Implement <goal>.

Goal:

- ...

Constraints:

- ...

Tasks:

1) ...

Deliverables:

- ...
```

## Archive

Finished tickets live under `archive/`:

- `archive/setup/` – initial project setup tickets (incl. `ORDER.md`, the recommended sequence they were done in)
- `archive/features/` – implemented feature tickets
