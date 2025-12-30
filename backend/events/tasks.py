from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

from bars.models import Bar
from events.services import end_expired_events, roll_event_for_bar, serialize_active_event


def _broadcast_event(bar_id: int, payload_type: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    group_name = settings.MARKET_CHANNEL_GROUP.format(bar_id=bar_id)
    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "market.message", "data": {"type": payload_type, "payload": payload}},
    )


def _roll_and_broadcast(bar_id: int) -> None:
    event = roll_event_for_bar(bar_id)
    if event:
        _broadcast_event(bar_id, "event.started", serialize_active_event(event))


@shared_task
def event_roll(bar_id: int) -> None:
    _roll_and_broadcast(bar_id)


@shared_task
def event_roll_all_bars() -> None:
    for bar_id in Bar.objects.values_list("id", flat=True):
        _roll_and_broadcast(bar_id)


@shared_task
def cleanup_expired_events() -> None:
    now = timezone.now()
    for bar_id in Bar.objects.values_list("id", flat=True):
        for ended_event in end_expired_events(bar_id, now=now):
            _broadcast_event(bar_id, "event.ended", serialize_active_event(ended_event))
