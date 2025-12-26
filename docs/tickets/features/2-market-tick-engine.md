Implementiere die Market Tick Engine in Django mit Celery + Celery Beat.

Ziel:

- Periodischer Tick, der pro Bar Preise Richtung base_price revertiert (Mean-Reversion)
- Grenzen clampen, optional currency rounding step
- Persist der neuen current_price + PricePoints (optional konfigurierbar)
- Tests für Tick-Logik

Vorgaben:

- Tick-Rate als Bar-Setting (z.B. tick_interval_seconds) und reversion_rate
- Reversion: price = price + (base_price - price) * reversion_rate
- Nach Berechnung clamp(min_price, max_price)
- Wenn rounding_step gesetzt: runde auf nearest step (z.B. 0.05)

Concurrency:

- Nutze einen Bar-weiten Lock, damit Tick nicht parallel zu Trade-Updates läuft.
    - Wenn Redis verfügbar: redis lock
    - Sonst: Postgres advisory lock (preferred, da Postgres vorhanden)

Aufgaben:

1) Celery Setup (wenn nicht vorhanden): `celery.py`, Django settings, beat schedule
2) Task `market_tick(bar_id)` + task `market_tick_all_bars()`
3) Retention: PricePoint nur alle N Ticks oder per Setting (Default: jedes Mal OK für MVP)
4) Tests: Reversion-Konvergenz, clamp, rounding, lock verhindert parallel execution (simulieren)

Deliverables:

- Celery config + tasks + tests
- Dokumentiere in `docs/architecture.md` den Tick-Mechanismus, falls neu
