from channels.generic.websocket import AsyncJsonWebsocketConsumer


class MarketConsumer(AsyncJsonWebsocketConsumer):
    """Bridges websocket clients to the market.<bar_id> channel layer groups."""

    async def connect(self):
        self.bar_id = self.scope["url_route"]["kwargs"]["bar_id"]
        self.group_name = f"market.{self.bar_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def market_message(self, event):
        await self.send_json(event["data"])

    async def receive_json(self, content, **kwargs):
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "market.message", "data": content},
        )
