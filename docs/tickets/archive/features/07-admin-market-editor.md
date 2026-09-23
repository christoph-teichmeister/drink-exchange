# 07 – In-app admin: market settings editor

> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a bar manager I want to configure my bar's market (settings, drinks and market events) directly in the Drink
Exchange admin view, so I do not have to switch to the Django admin during service.

## Background

`/admin/<slug>` currently only links into the Django admin (`frontend/src/routes/admin/[barId]/+page.svelte`). Every
`BarAssignment` user can open it, and there is no API for reading or writing configuration. Pricing parameters are
described in ADR 0001; ticket 06 added `impulse_factor` and `normalization_factor` to `Bar`.

## Acceptance Criteria

- **Roles:** `BarAssignment` gets a `role` field: `operator` (default: trading desk and board) or `manager` (also
  admin). Add a migration; existing assignments become `operator`. `ensure_dev_data` makes the dev superuser a
  `manager` of the demo bars. Django superusers count as managers for every bar they are assigned to.
- **API** (JSON only, session auth, `manager` role required; 401 / 403 / 404 / 415 like the existing endpoints; 400
  with per-field translated errors from model validation, including the drink bounds constraints):
  - `GET`/`PATCH /api/bars/<slug>/settings/`: `name`, `description`, `tick_interval_seconds`, `reversion_rate`,
    `impulse_factor`, `normalization_factor`, `price_point_retention_ticks`.
  - `GET`/`POST /api/bars/<slug>/drinks/` and `PATCH`/`DELETE /api/bars/<slug>/drinks/<id>/`: `name`, `base_price`,
    `min_price`, `max_price`, `volatility`, `weight`, `rounding_step`. Creating a drink sets
    `current_price = base_price`. Deleting a drink that has trades is rejected with 409 and a translated message.
  - `GET`/`POST /api/bars/<slug>/events/` and `PATCH`/`DELETE /api/bars/<slug>/events/<id>/`: `name`,
    `description`, `type`, `probability_weight`, `duration_seconds`, `cooldown_seconds`, and `params` limited to
    `start_multiplier` (number > 0) and, for `focus`, `target_drink_ids` (drinks of the same bar).
  - Every endpoint only ever touches rows of the bar in the URL.
- **Live effect:** changing a drink's bounds or base price clamps `current_price` into the new bounds in the same
  transaction and broadcasts `prices.update`. Adding or removing a drink broadcasts too, so the board and desk update
  without a reload.
- **Frontend `/admin/<slug>`** (staff views design rules in `AGENTS.md`):
  - Three sections: bar settings form, drinks table with inline edit / add / delete, events table with inline edit /
    add / delete (type select; target drinks multi-select for `focus`).
  - Numbers are entered and shown in the active locale (comma decimals in German).
  - Field errors from the API appear next to the field; save and delete show success or error feedback; delete asks
    for confirmation.
  - `operator` users no longer see the Admin buttons (lobby, desk) and get a translated 403 page on `/admin/<slug>`.
  - The Django admin links remain as a small "Advanced" footer.
- All user-facing text in `i18n.ts` (de and en, same keys).

## Tech Notes

- Keep one class per file: views as functions in `bars/views/…` or a new `market/views/…` module, input validation via
  small form or serializer helpers that call `full_clean()` so the model constraints stay the single source of truth.
- Reuse `api/json_body.py`, `json_login_required` and the assignment check; add a `manager_required` helper next to
  it rather than repeating the role check in every view.
- Clamp and broadcast through `market/services/price_math.py` and `market/services/broadcast.py`; lock the drink row
  with `select_for_update()` like the tick and `apply_trade`.
- Tests:
  - backend: role matrix (anonymous 401, other bar 403/404, operator 403, manager 200) for every endpoint, validation
    errors (bounds, negative factors, focus targets from another bar), 409 on deleting a drink with trades, clamp +
    broadcast on bound changes, bar isolation;
  - frontend: locale number parsing/formatting helpers, API client error mapping, hiding admin entry points for
    operators.

## Dependencies

- Ticket 06 (trade impulses; `impulse_factor` / `normalization_factor`), PR #21 (staff view design, admin page shell).

## Out of scope

- Managing users and bar assignments (stays in the Django admin).
- Creating or deleting bars.
- Price history or trade analytics.
