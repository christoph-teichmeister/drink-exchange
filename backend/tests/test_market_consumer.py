from datetime import timedelta
from decimal import Decimal

import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.test import override_settings
from django.utils import timezone

from bars.models import Bar
from config.asgi import application
from events.models import ActiveEvent, EventDefinition
from market.models.drink import Drink
from market.serializers import build_price_update_payload
from market.services import broadcast_prices

IN_MEMORY_CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


@database_sync_to_async
def _create_bar(slug: str, name: str) -> Bar:
    return Bar.objects.create(slug=slug, name=name)


@database_sync_to_async
def _create_drink(bar: Bar, name: str, base_price: Decimal) -> Drink:
    return Drink.objects.create(bar=bar, name=name, base_price=base_price)


@database_sync_to_async
def _create_event_definition(name: str, description: str) -> EventDefinition:
    return EventDefinition.objects.create(name=name, description=description)


@database_sync_to_async
def _create_active_event(
    bar: Bar,
    definition: EventDefinition,
    starts_at,
    ends_at,
) -> ActiveEvent:
    return ActiveEvent.objects.create(
        bar=bar,
        definition=definition,
        starts_at=starts_at,
        ends_at=ends_at,
        is_active=True,
    )


async def _drain_until_status(comm: WebsocketCommunicator):
    while True:
        message = await comm.receive_json_from()
        if message.get("type") == "market.status":
            return message


@override_settings(CHANNEL_LAYERS=IN_MEMORY_CHANNEL_LAYERS)
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_market_consumer_delivers_initial_snapshot():
    bar = await _create_bar(slug="river-bar", name="River Bar")
    drink = await _create_drink(bar, name="Lager", base_price=Decimal("3.50"))
    definition = await _create_event_definition(name="Happy Hour", description="Discounts on lagers.")
    now = timezone.now()
    await _create_active_event(
        bar,
        definition,
        starts_at=now,
        ends_at=now + timedelta(hours=1),
    )

    communicator = WebsocketCommunicator(application, f"/ws/market/{bar.slug}/")
    connected, _ = await communicator.connect()
    assert connected

    snapshot = await communicator.receive_json_from()
    assert snapshot["type"] == "prices.update"
    assert snapshot["bar_id"] == bar.slug
    assert snapshot["payload"]["prices"][0]["drink_id"] == drink.id
    assert snapshot["payload"]["active_events"][0]["definition_name"] == definition.name

    event_message = await communicator.receive_json_from()
    assert event_message["type"] == "event.started"

    status = await communicator.receive_json_from()
    assert status["type"] == "market.status"

    await communicator.disconnect()


@override_settings(CHANNEL_LAYERS=IN_MEMORY_CHANNEL_LAYERS)
@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
async def test_broadcast_prices_publishes_to_group():
    bar = await _create_bar(slug="oak-bar", name="Oak Bar")
    drink = await _create_drink(bar, name="Pilsner", base_price=Decimal("4.00"))

    communicator = WebsocketCommunicator(application, f"/ws/market/{bar.slug}/")
    connected, _ = await communicator.connect()
    assert connected

    await _drain_until_status(communicator)

    payload = build_price_update_payload(bar.slug, [drink], [])
    await database_sync_to_async(broadcast_prices)(bar.slug, payload)

    update = await communicator.receive_json_from()
    assert update["type"] == "prices.update"
    assert update["payload"]["prices"][0]["drink_name"] == drink.name

    await communicator.disconnect()
