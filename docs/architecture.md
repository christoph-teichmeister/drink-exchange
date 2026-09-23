# Architecture

## Goal

A PWA for bars that simulates a "stock market" for drink prices:

- Purchases influence prices (demand ↑ -> price ↑, others drop)
- Random/configurable events influence the market
- 3 views: Admin (configuration), User (prices + alerts), Big Screen (ticker + charts)
- Live updates via WebSockets

## Non-goals (initial)

- POS/cash register integration (purchases are initially fed in manually/externally)
- Payment processing
- Multi-tenant SaaS billing/subscriptions (later)

---

## System overview

### Components

1. **Backend (Django)**
    - Domain models (Bar, Drink, MarketSession, Trade/Purchase, Event, PricePoint)
    - Pricing engine (deterministic rules + event impact)
    - Event engine (probabilities, triggers, duration, cooldowns)
    - API (read/write for Admin UI & User UI)
    - WebSockets (broadcast of prices, events, ticker data)

2. **Realtime layer**
    - **Django Channels** (ASGI)
    - **Redis** as channel layer

3. **Worker / scheduling**
    - **Celery** for:
        - Market tick (periodic, e.g. every 5s)
        - Event rolls (e.g. every 30s)
        - Cleanup/retention jobs

4. **Database**
    - **PostgreSQL**
    - Timeseries-like storage via `PricePoint` (downsampling/retention later)

5. **Frontend (PWA)**
    - Mobile-first User UI + alerts
    - Admin UI (optionally Django Admin + thin UI)
    - Big Screen board (fullscreen, charts)
    - WebSocket client for live updates

---

## Runtime flows

### Flow A: Purchase/trade influences price

1. A purchase is stored as a `Trade` (or `Purchase`): (bar_id, drink_id, qty, timestamp)
2. Pricing engine computes the price change:
    - Direct impulse on the purchased drink (price up)
    - Offset on other drinks (price down / normalization)
3. New prices are persisted (`Drink.current_price`) + optional `PricePoint`
4. WebSocket broadcast to:
    - `market.<bar_id>` group: current prices + delta + timestamp

### Flow B: Periodic market tick

1. Celery Beat triggers `market_tick_all_bars` (e.g. every 5 seconds), which selects only bars whose interval defined
   per `Bar.tick_interval_seconds` has elapsed, and calls `market_tick(bar_id)`.
2. Tick performs:
    - Mean-reversion: `price = price + (base_price - price) * reversion_rate`
    - Clamp to `Drink.min_price`/`Drink.max_price` and optional `rounding_step`
    - Persist `Drink.current_price`, write PricePoints at the regular downsampling rate
      (`Bar.price_point_retention_ticks`)
    - Updates: `Bar.last_tick_at`, `Bar.tick_counter` + WebSocket broadcast
3. Persist + broadcast

### Flow C: Event engine

1. Celery Beat triggers `event_roll(bar_id)` every Y seconds
2. Engine determines (pseudo-random, weighted):
    - whether an event starts
    - which event (configurable probabilities)
3. Event is persisted as `ActiveEvent` (start, end, params)
4. Broadcast: event started/ended (overlay + chart annotations)

---

## Data model (high level)

### Core

- `Bar`
    - name, timezone, settings (tick_rate, event_rate, currency, …), plus `tick_interval_seconds`,
      `reversion_rate`, `price_point_retention_ticks`, `last_tick_at`/`tick_counter` to control the market tick
- `Drink`
    - bar FK
    - name, base_price, current_price
    - min_price, max_price
    - volatility (impulse strength)
    - weight (for normalization)
- `MarketSession`
    - bar FK
    - status (running/paused)
    - started_at, ended_at
- `Trade`
    - bar FK, drink FK
    - qty, occurred_at
    - source (manual/api/import) optional
- `PricePoint`
    - bar FK, drink FK
    - price, recorded_at
    - optional: open/high/low/close for candles (later)
- `EventDefinition`
    - bar FK (or global)
    - type (boom/crash/focus/…)
    - probability_weight
    - duration_seconds
    - params JSON (impact, targets, …)
- `ActiveEvent`
    - event_definition FK
    - bar FK
    - starts_at, ends_at
    - resolved_at
    - state JSON (random seed, computed multipliers)

---

## APIs & WebSockets

### REST (examples)

- `GET /api/bars/{bar_id}/market/` -> current prices + active events
- `POST /api/bars/{bar_id}/trades/` -> submit a purchase
- `GET /api/bars/{bar_id}/drinks/` -> drinks + config
- `POST /api/bars/{bar_id}/alerts/` -> price alert (user)

### WebSockets

- `ws://.../ws/market/{bar_id}/`
    - Events:
        - `prices.update` (full snapshot or delta)
        - `event.started`
        - `event.ended`
        - `market.status`

Payload standard:

- Always: `bar_id`, `timestamp`, `type`
- For prices: list of `{drink_id, price, delta, trend}`

#### JSON Schema (MVP)

```json
{
  "type": "prices.update",
  "bar_id": "string",
  "timestamp": "2025-12-31T23:59:59Z",
  "payload": {
    "prices": [
      {
        "drink_id": 42,
        "drink_name": "IPA",
        "price": "3.50",
        "base_price": "3.00",
        "delta": "0.50",
        "trend": "up"
      }
    ],
    "active_events": [
      {
        "event_id": 1,
        "definition_id": 5,
        "definition_name": "Happy Hour",
        "starts_at": "2025-12-31T23:00:00Z",
        "ends_at": "2026-01-01T01:00:00Z",
        "is_active": true
      }
    ]
  }
}
```

For `event.started` / `event.ended` the same event fields are returned in the `payload`; `market.status` provides
`payload.status` (e.g. `running`, `idle`) plus optional `metadata`.

---

## Consistency & concurrency

### Requirements

- Multiple trades can arrive at the same time
- The price engine must remain consistent

### Approach

- Run price updates per bar serially (via Redis lock or DB advisory lock)
- Celery tasks (`market_tick`/`market_tick_all_bars`) use `bar_lock`, which prefers Redis, falls back to Postgres
  advisory locks, and as a last resort per-process locks, so ticks and trades don't write concurrently.
- Trade ingestion:
    - Persist trade
    - Queue "recompute prices" for bar_id (coalescing possible)
- Tick/event/trade updates use the same locking mechanism

---

## Observability

- Structured logging (JSON)
- Admin audit log: who configured what (CommonInfo provides `created_by`/`lastmodified_by`, CommonInfoAdminMixin +
  CurrentRequestMiddleware maintain the context, see [Ambient Toolbox CommonInfo docs](https://ambient-toolbox.readthedocs.io/en/latest/features/models.html#commoninfo) for more
  context on the audit fields).
- Metrics later: tick duration, broadcast counts, active users

---

## Security

- Public read-only market endpoints possible (via bar token/QR)
- Admin endpoints: Django auth + staff roles
- Rate limiting:
    - Trades endpoint
    - WebSocket connections per bar/token

---

## Deployment (MVP)

- Docker Compose:
    - web (Django ASGI)
    - worker (Celery)
    - beat (Celery Beat)
    - redis
    - postgres
    - optional: nginx
- PWA: static (or served via Django static) + WS endpoint on the same domain

---

## Scaling (later)

- Multi-tenant SaaS
- Per-bar sharding in Redis/DB
- Downsampling of PricePoints (candles)
- Read replica for analytics

---

## Decision log (ADRs)

- Pricing logic: `docs/adr/0001-pricing-engine.md`
- Realtime stack: Channels + Redis
- Tick/event scheduling: Celery Beat
