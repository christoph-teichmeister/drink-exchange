from celery import shared_task
from django.utils import timezone

from bars.models import Bar
from events.services import end_expired_events, roll_event_for_bar
from market.services import broadcast_event_ended, broadcast_event_started


def _roll_and_broadcast(bar: Bar) -> None:
    # End expired events here so their `event.ended` broadcast is not swallowed by the roll.
    for ended_event in end_expired_events(bar.pk):
        broadcast_event_ended(bar.slug, ended_event)
    event = roll_event_for_bar(bar.pk)
    if event:
        broadcast_event_started(bar.slug, event)


@shared_task
def event_roll(bar_id: int) -> None:
    bar = Bar.objects.filter(pk=bar_id).first()
    if bar:
        _roll_and_broadcast(bar)


@shared_task
def event_roll_all_bars() -> None:
    for bar in Bar.objects.only("pk", "slug"):
        _roll_and_broadcast(bar)


@shared_task
def cleanup_expired_events() -> None:
    now = timezone.now()
    for bar in Bar.objects.only("pk", "slug"):
        for ended_event in end_expired_events(bar.pk, now=now):
            broadcast_event_ended(bar.slug, ended_event)
