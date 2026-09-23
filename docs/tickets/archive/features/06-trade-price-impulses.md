# 06 – Trade price impulses and normalization

> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a bar operator I want every recorded purchase to push the purchased drink's price up and the other drinks' prices
slightly down, so the board reacts to real demand as described in ADR 0001.

## Background

ADR 0001 defines five pricing steps. Mean-reversion (3), event multipliers (4) and clamping/rounding (5) are
implemented in `market/tasks.py`. Steps (1) impulse per trade and (2) normalization are missing: `Trade` rows are only
logged (`market/models/trade.py`) and never influence `Drink.current_price`. `Drink.volatility` and `Drink.weight`
already exist but are unused.

## Acceptance Criteria

- Recording a trade of `qty` for a drink applies an impulse to that drink:
  `impulse = qty * volatility * impulse_factor` (in currency units, see Tech Notes) and
  `current_price += impulse`.
- The same impulse is offset on every *other* drink of the bar, proportional to its weight:
  `price_other -= impulse * normalization_factor * (weight_other / sum_weights_others)`.
  With a single drink in the bar, no normalization happens.
- `impulse_factor` and `normalization_factor` are configurable per bar (new `Bar` fields with sensible defaults, admin
  editable, validated to be `>= 0`; `normalization_factor <= 1`).
- All affected prices are rounded to the drink's `rounding_step` and clamped to `[min_price, max_price]` (round, then
  clamp, as in the tick).
- Applying a trade and the periodic tick never lose each other's updates: both run inside `transaction.atomic()` with
  `select_for_update()` on the affected drink rows.
- Trades can be recorded through a new endpoint `POST /api/bars/<slug>/trades/` (`{"drink_id": int, "qty": int}`):
  - requires an authenticated user with a `BarAssignment` for the bar (401 / 403 otherwise), JSON body only (415),
  - validates that the drink belongs to the bar and `qty >= 1` (400 with a translated `detail` otherwise),
  - stores the `Trade` with the drink's price *before* the impulse,
  - returns the trade and the new prices of all drinks in the bar (201).
- After a trade, a `prices.update` frame (`build_price_update_payload`) is broadcast to `market.<slug>` so the board
  updates immediately instead of waiting for the next tick.
- Recording a trade through the Django admin applies the same logic (one shared service function, no duplicated math).
- The REST snapshot and the WS frames keep their current shapes.

## Tech Notes

- Put the math into a service module, e.g. `market/services/trading.py` with `apply_trade(bar, drink, qty) -> Trade`,
  and keep `market/tasks.py` responsible only for ticks. Reuse `_round_to_step` / `_clamp_price` (move them to a shared
  module rather than importing private names across modules).
- Units: treat `volatility` as a fraction of `base_price` so impulses scale with the drink's price level, i.e.
  `impulse = qty * volatility * impulse_factor * base_price`. Document the final formula in ADR 0001 if it deviates
  from the ADR text.
- Mean-reversion then pulls prices back towards `base_price × event multiplier` on subsequent ticks; no change to the
  tick is needed beyond the shared helpers.
- Tests (see ADR 0001 "Test strategy"):
  - impulse raises the purchased drink by the expected amount,
  - normalization lowers the others proportionally to `weight` and the total downward move equals
    `impulse * normalization_factor` before clamping,
  - rounding + clamping keep every price within bounds (including min/max edge cases),
  - endpoint: 201 happy path, 400 foreign drink / bad qty, 401, 403, 415, and a broadcast to the slug group,
  - a property-style test that many random trades plus ticks keep all prices within `[min, max]`.
- Add a migration for the new `Bar` fields; update `ensure_dev_data` only if the defaults are not sensible for the
  demo bars.

## Dependencies

- ADR 0001 (pricing engine)
- Archived tickets `02-market-tick-engine.md` and `05-configurable-event-system.md`

## Out of scope

- Frontend UI for recording trades (separate ticket; the endpoint is usable via admin/API for now).
- POS integration, payments, per-user trade history.
