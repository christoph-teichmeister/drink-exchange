# Drink Exchange Backend

Django 6 service with Channels (ASGI/WebSockets) and Celery, managed with `uv`. Setup, environment variables and the
full command list live in the [root README](../README.md) and [`AGENTS.md`](../AGENTS.md).

## Local development

```bash
cp ../.env.example ../.env          # settings load the root .env
uv sync                             # runtime + dev dependencies
uv run python manage.py migrate
uv run python manage.py ensure_dev_data
uv run uvicorn config.asgi:application --reload
uv run celery -A config worker -l info   # separate shell
uv run celery -A config beat -l info     # separate shell
```

## Apps

| App | Responsibility |
| --- | --- |
| `config` | Settings (`base`, `dev`, `prod`), ASGI routing, Celery app and beat schedule |
| `bars` | `Bar`, `BarAssignment`, REST market snapshot (`/api/bars/<slug>/market/`), `ensure_dev_data` |
| `market` | Drinks, price points, trades; the tick task, WebSocket consumer and frame serializers |
| `events` | Event definitions, active events, selection and multipliers, roll/cleanup tasks |
| `api` | Session login/logout/me and locale endpoints |

## Realtime flow

1. Celery beat triggers `market_tick_all_bars`, which enqueues one `market_tick` per due bar.
2. The tick moves each drink's price towards `base_price × active event multiplier`, rounds, clamps and optionally
   records a `PricePoint`, then broadcasts a `prices.update` frame to the `market.<bar-slug>` group.
3. `event_roll_all_bars` / `cleanup_expired_events` start and end events and broadcast `event.started` /
   `event.ended`.
4. `MarketConsumer` (`/ws/market/<bar-slug>/`) authenticates the session, checks the bar assignment and the Origin,
   sends an initial snapshot and then relays group messages.
