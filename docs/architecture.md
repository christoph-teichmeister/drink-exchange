# Architecture

## Ziel

Eine PWA für Bars, die einen „Aktienmarkt“ für Getränkepreise simuliert:

- Käufe beeinflussen Preise (Nachfrage ↑ -> Preis ↑, andere sinken)
- Random/konfigurierbare Events beeinflussen den Markt
- 3 Views: Admin (Konfiguration), User (Preise + Alerts), Big Screen (Ticker + Charts)
- Live-Updates via WebSockets

## Nicht-Ziele (initial)

- POS/Kassensystem-Integration (Käufe werden zunächst manuell/extern eingespeist)
- Zahlungsabwicklung
- Multi-tenant SaaS-Abrechnung/Subscriptions (später)

---

## Systemüberblick

### Komponenten

1. **Backend (Django)**
    - Domain-Modelle (Bar, Drink, MarketSession, Trade/Kauf, Event, PricePoint)
    - Preisengine (deterministische Regeln + Event-Impact)
    - Eventengine (Wahrscheinlichkeiten, Trigger, Dauer, Cooldowns)
    - API (read/write für Admin-UI & User-UI)
    - WebSockets (Broadcast von Preisen, Events, Ticker-Daten)

2. **Realtime Layer**
    - **Django Channels** (ASGI)
    - **Redis** als Channel Layer

3. **Worker / Scheduling**
    - **Celery** für:
        - Market Tick (periodisch, z. B. alle 5s)
        - Event-Rolls (z. B. alle 30s)
        - Cleanup/Retention Jobs

4. **Datenbank**
    - **PostgreSQL**
    - Timeseries-ähnliche Speicherung via `PricePoint` (downsampling/retention später)

5. **Frontend (PWA)**
    - Mobile-first User-UI + Alerts
    - Admin-UI (optional Django Admin + thin UI)
    - Big Screen Board (Fullscreen, Charts)
    - WebSocket-Client für Live-Updates

---

## Laufzeit-Flows

### Flow A: Kauf/Trade beeinflusst Preis

1. Kauf wird als `Trade` (oder `Purchase`) gespeichert: (bar_id, drink_id, qty, timestamp)
2. Preisengine berechnet Preisänderung:
    - Direktimpuls auf gekauftes Getränk (Price Up)
    - Ausgleich auf andere Getränke (Price Down / normalization)
3. Neue Preise werden persistiert (`Drink.current_price`) + optionaler `PricePoint`
4. WebSocket-Broadcast an:
    - `market.<bar_id>` group: aktuelle Preise + delta + timestamp

### Flow B: Periodischer Market Tick

1. Celery Beat triggert `market_tick_all_bars` (beispielsweise alle 5 Sekunden), das nur Bars auswählt, deren per-`Bar.tick_interval_seconds` definierte Intervalle abgelaufen sind, und `market_tick(bar_id)` aufruft.
2. Tick führt aus:
    - Mean-Reversion: `price = price + (base_price - price) * reversion_rate`
    - Clamp auf `Drink.min_price`/`Drink.max_price` und optionales `rounding_step`
    - Persistiere `Drink.current_price`, schreibe PricePoints nach regulärer Downsampling-Rate (`Bar.price_point_retention_ticks`)
    - Updates: `Bar.last_tick_at`, `Bar.tick_counter` + WebSocket-Broadcast
3. Persist + Broadcast

### Flow C: Event Engine

1. Celery Beat triggert `event_roll(bar_id)` alle Y Sekunden
2. Engine bestimmt (pseudo-zufällig, gewichtet):
    - ob ein Event startet
    - welches Event (konfigurierbare Wahrscheinlichkeiten)
3. Event wird als `ActiveEvent` persistiert (start, end, params)
4. Broadcast: Event started/ended (Overlay + Charts-Annotierungen)

---

## Datenmodell (high level)

### Core

- `Bar`
    - name, timezone, settings (tick_rate, event_rate, currency, …), plus `tick_interval_seconds`, `reversion_rate`, `price_point_retention_ticks`, `last_tick_at`/`tick_counter` zur Steuerung des Market-Ticks
- `Drink`
    - bar FK
    - name, base_price, current_price
    - min_price, max_price
    - volatility (impulse strength)
    - weight (für normalization)
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
    - optional: open/high/low/close für Candles (später)
- `EventDefinition`
    - bar FK (oder global)
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

### REST (Beispiele)

- `GET /api/bars/{bar_id}/market/` -> aktuelle Preise + active events
- `POST /api/bars/{bar_id}/trades/` -> Kauf einreichen
- `GET /api/bars/{bar_id}/drinks/` -> Drinks + Config
- `POST /api/bars/{bar_id}/alerts/` -> Preiswecker (User)

### WebSockets

- `ws://.../ws/market/{bar_id}/`
    - Events:
        - `prices.update` (vollständiger snapshot oder delta)
        - `event.started`
        - `event.ended`
        - `market.status`

Payload-Standard:

- Immer: `bar_id`, `timestamp`, `type`
- Bei Preisen: Liste von `{drink_id, price, delta, trend}`

---

## Konsistenz & Concurrency

### Anforderungen

- Mehrere Trades können zeitgleich eintreffen
- Price Engine muss konsistent bleiben

### Ansatz

- Preisupdates pro Bar seriell ausführen (per Redis lock oder DB advisory lock)
- Celery tasks (`market_tick`/`market_tick_all_bars`) nutzen `bar_lock`, das bevorzugt Redis, sonst Postgres Advisory Locks und als Fallback pro-Prozess Locks, damit Tick und Trades nicht gleichzeitig schreiben.
- Trade-Eingang:
    - Persist Trade
    - Queue „recompute prices“ für bar_id (coalescing möglich)
- Tick/Event/Trade-Updates nutzen denselben Lock-Mechanismus

---

## Observability

- Structured logging (JSON)
- Admin Audit Log: wer hat was konfiguriert (CommonInfo liefert `created_by`/`lastmodified_by`, CommonInfoAdminMixin + CurrentRequestMiddleware pflegen den Kontext, siehe [Ambient Toolbox CommonInfo docs](https://ambient-toolbox.readthedocs.io/en/latest/features/models.html#commoninfo) für mehr Kontext zu den Audit-Feldern).
- Metrics später: tick duration, broadcast counts, active users

---

## Security

- Public read-only market endpoints möglich (per bar-token/QR)
- Admin endpoints: Django auth + staff roles
- Rate limiting:
    - Trades endpoint
    - WebSocket connections pro bar/token

---

## Deployment (MVP)

- Docker Compose:
    - web (Django ASGI)
    - worker (Celery)
    - beat (Celery Beat)
    - redis
    - postgres
    - optional: nginx
- PWA: statisch (oder über Django static) + WS endpoint auf gleicher Domain

---

## Skalierung (später)

- Multi-tenant SaaS
- Per-Bar sharding in Redis/DB
- Downsampling von PricePoints (Candles)
- Read replica für analytics

---

## Entscheidungslog (ADRs)

- Preislogik: `docs/adr/0001-pricing-engine.md`
- Realtime Stack: Channels + Redis
- Tick/Event Scheduling: Celery Beat
