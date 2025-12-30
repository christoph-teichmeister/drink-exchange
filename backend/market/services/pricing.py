from django.utils import timezone

from events.models import ActiveEvent
from events.services import compute_event_multiplier


def get_effective_multiplier(bar_id: int, drink_id: int, now=None) -> float:
    now = now or timezone.now()
    active_events = ActiveEvent.objects.filter(
        bar_id=bar_id,
        is_active=True,
        starts_at__lte=now,
        ends_at__gt=now,
    ).select_related("definition")
    multiplier = 1.0
    for active_event in active_events:
        multiplier *= compute_event_multiplier(active_event, drink_id, now=now)
    return multiplier
