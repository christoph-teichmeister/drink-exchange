from typing import Mapping, Optional

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings

from market.serializers import (
    build_event_payload,
    build_market_status_payload,
)


def _group_name(bar_id: str) -> str:
    return settings.MARKET_CHANNEL_GROUP.format(bar_id=bar_id)


def _send_to_group(bar_id: str, payload: Mapping[str, object]) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        _group_name(bar_id),
        {"type": "market.message", "data": payload},
    )


def broadcast_prices(bar_id: str, payload: Mapping[str, object]) -> None:
    _send_to_group(bar_id, payload)


def broadcast_event_started(
    bar_id: str,
    event,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    payload = build_event_payload(bar_id, event, "event.started", extra=metadata)
    _send_to_group(bar_id, payload)


def broadcast_event_ended(
    bar_id: str,
    event,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    payload = build_event_payload(bar_id, event, "event.ended", extra=metadata)
    _send_to_group(bar_id, payload)


def broadcast_market_status(
    bar_id: str,
    status: str,
    metadata: Optional[Mapping[str, object]] = None,
) -> None:
    payload = build_market_status_payload(bar_id, status, metadata=metadata)
    _send_to_group(bar_id, payload)
