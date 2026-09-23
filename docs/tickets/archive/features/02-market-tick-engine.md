Implement the market tick engine in Django with Celery + Celery Beat.

Goal:

- Periodic tick that reverts prices per bar toward base_price (mean-reversion)
- Clamp limits, optional currency rounding step
- Persist the new current_price + PricePoints (optionally configurable)
- Tests for the tick logic

Constraints:

- Tick rate as a bar setting (e.g. tick_interval_seconds) and reversion_rate
- Reversion: price = price + (base_price - price) * reversion_rate
- After calculation, clamp(min_price, max_price)
- If rounding_step is set: round to the nearest step (e.g. 0.05)

Concurrency:

- Use a bar-wide lock so the tick doesn't run in parallel with trade updates.
    - If Redis is available: Redis lock
    - Otherwise: Postgres advisory lock (preferred, since Postgres is present)

Tasks:

1) Celery setup (if not present): `celery.py`, Django settings, beat schedule
2) Task `market_tick(bar_id)` + task `market_tick_all_bars()`
3) Retention: PricePoint only every N ticks or per setting (default: every time is OK for MVP)
4) Tests: reversion convergence, clamp, rounding, lock prevents parallel execution (simulated)

Deliverables:

- Celery config + tasks + tests
- Document the tick mechanism in `docs/architecture.md`, if new
