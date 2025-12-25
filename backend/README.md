# Drink Exchange Backend

Dieses Verzeichnis enthält den Django-Backend-Service mit Channels/ASGI, verwaltet über `uv`.

## Quickstart

1. SSL/Env vorbereiten (siehe `/ .env.example`):
   ```bash
   cp .env.example .env
   ```
2. Abhängigkeiten installieren:
   ```bash
   cd backend
   uv sync --frozen
   ```
3. Datenbank migrieren und starten:
   ```bash
   uv run python manage.py migrate
   uv run uvicorn config.asgi:application --reload
   ```

Alternativ kann `uv run python manage.py runserver` verwendet werden, wenn die Django-entwicklungsumgebung bevorzugt wird.

## Asgi & Channels

- ASGI-Server: `uvicorn config.asgi:application` (wir nutzen ASGI, damit Channels und Websockets nativ laufen).
- Der Channel Layer hinterlegt in `config/settings` nutzt `REDIS_URL` und mappt Market-Events auf Gruppen wie `market.<bar_id>`.
- Der `MarketConsumer` unter `market/consumers.py` bridged Websocket-Verbindungen zu genau diesen Gruppen.

## Umgebung

Folgende Variablen sollten gesetzt werden (siehe `.env.example`):

| Variable | Beschreibung |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django-Secret-Key (produktiv muss ein sicherer Schlüssel gesetzt werden). |
| `DATABASE_URL` | z.B. `sqlite:///db.sqlite3` oder `postgresql://user:pass@host/db`. |
| `REDIS_URL` | z.B. `redis://127.0.0.1:6379/0` (Channel Layer). |
| `DJANGO_ALLOWED_HOSTS` | Komma-separierte Liste erlaubter Hosts. |
| `DJANGO_DEBUG` | `true` oder `false` für Debug-Modus. |
