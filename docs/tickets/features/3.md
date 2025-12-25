Implementiere WebSocket Live-Preisstream mit Django Channels.

Ziel:

- WS Endpoint: /ws/market/<bar_id>/
- Group Broadcast: market.<bar_id>
- Sende Events: prices.update, event.started, event.ended, market.status
- JSON Payloads standardisieren

Vorgaben:

- Channels/ASGI Setup (wenn nicht vorhanden)
- Redis Channel Layer in docker-compose (wenn repo infra enthält) oder Settings vorbereiten
- Consumer:
    - on_connect: join group, send initial snapshot (current prices + active events)
    - on_receive: ignore oder nur ping/pong (read-only initial)
- Broadcast:
    - Bei Preisänderung (Tick oder Trade) triggert Service function `broadcast_prices(bar_id, payload)`
    - Verwende `async_to_sync(channel_layer.group_send)`

Aufgaben:

1) Implementiere Consumer `MarketConsumer`
2) Implementiere Serializer/Schema-Funktion (keine DRF Pflicht)
3) In Tick Engine und später Trade-Handling hooken: broadcast after commit
4) Tests:

- Consumer connect + receives snapshot (Channels testing utils)
- group_send payload format

Deliverables:

- channels config, routing, consumer, helper functions, tests
- Minimaler JSON Schema Abschnitt in docs (architecture.md)
