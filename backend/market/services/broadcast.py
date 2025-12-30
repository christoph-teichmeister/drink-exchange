from typing import Mapping, Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings

from market.serializers import (
    build_event_payload,
    build_market_status_payload,
)


def _group_name(bar_id: str) -> str:
    """Return the configured channel-layer group name for a bar slug."""
    return settings.MARKET_CHANNEL_GROUP.format(bar_id=bar_id)


def _send_to_group(bar_id: str, payload: Mapping[str, object]) -> None:
    """Push a prepared payload into the market channel group attachment."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    # Wrap the synchronous group_send call so we can reuse it from sync contexts.
    async_to_sync(channel_layer.group_send)(
        _group_name(bar_id),
        {"type": "market.message", "data": payload},
    )


def broadcast_prices(bar_id: str, payload: Mapping[str, object]) -> None:
    """Relay an outgoing price update snapshot to every websocket subscribed to the bar."""
    # Keep this simple; payload already matches the market.price serializer contract.
    _send_to_group(bar_id, payload)


def broadcast_event_started(
    bar_id: str,
    event,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    """Fire the event.started notification when a new market event becomes active."""
    payload = build_event_payload(bar_id, event, "event.started", extra=metadata)
    # Respect the shared serializer shape so downstream clients trust the frame.
    _send_to_group(bar_id, payload)


def broadcast_event_ended(
    bar_id: str,
    event,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    """Fire a terminal event.ended notice when the giveaway has completed."""
    payload = build_event_payload(bar_id, event, "event.ended", extra=metadata)
    # Deliver the same schema that event.started consumers already expect.
    _send_to_group(bar_id, payload)


def broadcast_market_status(
    bar_id: str,
    status: str,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    """Announce general market health updates that are not tied to specific events."""
    payload = build_market_status_payload(bar_id, status, metadata=metadata)
    # Use broadcast helper so the channel name resolution stays centralized.
    _send_to_group(bar_id, payload)
