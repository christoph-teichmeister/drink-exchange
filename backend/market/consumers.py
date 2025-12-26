from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from django.utils import timezone

from bars.models import Bar
from market.serializers import (
    build_event_payload,
    build_market_status_payload,
    build_price_update_payload,
)


class MarketConsumer(AsyncJsonWebsocketConsumer):
    """Bridges websocket clients to the market.<bar_id> channel layer groups."""

    async def connect(self):
        self.bar_id = self.scope["url_route"]["kwargs"]["bar_id"]
        self.group_name = settings.MARKET_CHANNEL_GROUP.format(bar_id=self.bar_id)
        self.bar = await self._load_bar()
        if not self.bar:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        snapshot_payload, events = await self._build_snapshot()
        await self.send_json(snapshot_payload)
        await self._send_event_notifications(events)

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def market_message(self, event):
        await self.send_json(event["data"])

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json(
                {
                    "type": "pong",
                    "bar_id": self.bar_id,
                    "timestamp": timezone.now().isoformat(),
                }
            )

    @database_sync_to_async
    def _load_bar(self):
        return Bar.objects.filter(slug=self.bar_id).first()

    @database_sync_to_async
    def _fetch_drinks(self):
        return list(self.bar.drinks.all())

    @database_sync_to_async
    def _fetch_active_events(self):
        events = self.bar.active_events.filter(is_active=True)
        events = events.select_related("definition")
        events = events.order_by("starts_at")
        return list(events)

    async def _build_snapshot(self):
        drinks = await self._fetch_drinks()
        events = await self._fetch_active_events()
        return build_price_update_payload(self.bar_id, drinks, events), events

    async def _send_event_notifications(self, events):
        for event in events:
            await self.send_json(build_event_payload(self.bar_id, event, "event.started"))
        status = "running" if events else "idle"
        await self.send_json(
            build_market_status_payload(
                self.bar_id,
                status,
                metadata={"active_event_count": len(events)},
            )
        )
