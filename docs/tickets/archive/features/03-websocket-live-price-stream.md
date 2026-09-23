Implement a WebSocket live price stream with Django Channels.

Goal:

- WS endpoint: /ws/market/<bar_id>/
- Group broadcast: market.<bar_id>
- Send events: prices.update, event.started, event.ended, market.status
- Standardize JSON payloads

Constraints:

- Channels/ASGI setup (if not present)
- Redis channel layer in docker-compose (if the repo infra includes it) or prepare settings
- Consumer:
    - on_connect: join group, send initial snapshot (current prices + active events)
    - on_receive: ignore, or ping/pong only (read-only initially)
- Broadcast:
    - On price change (tick or trade), trigger the service function `broadcast_prices(bar_id, payload)`
    - Use `async_to_sync(channel_layer.group_send)`

Tasks:

1) Implement consumer `MarketConsumer`
2) Implement serializer/schema function (DRF not required)
3) Hook into the tick engine and, later, trade handling: broadcast after commit
4) Tests:

- Consumer connect + receives snapshot (Channels testing utils)
- group_send payload format

Deliverables:

- channels config, routing, consumer, helper functions, tests
- Minimal JSON schema section in the docs (architecture.md)
