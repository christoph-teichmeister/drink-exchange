import random
from datetime import datetime, timedelta
from typing import List, Optional, Set

from django.utils import timezone

from events.models import ActiveEvent, EventDefinition


def select_event(
    bar_id: int,
    rng: Optional[random.Random] = None,
    now: Optional[datetime] = None,
) -> Optional[EventDefinition]:
    now = now or timezone.now()
    rng = rng or random
    if ActiveEvent.objects.filter(bar_id=bar_id, is_active=True, starts_at__lte=now, ends_at__gt=now).exists():
        return None
    definitions = EventDefinition.objects.filter(probability_weight__gt=0).order_by("pk")
    eligible = [
        definition
        for definition in definitions
        if definition.duration_seconds > 0 and not _is_in_cooldown(definition, bar_id, now)
    ]
    if not eligible:
        return None
    total_weight = sum(definition.probability_weight for definition in eligible)
    if total_weight <= 0:
        return None
    pick = rng.random() * total_weight
    cursor = 0.0
    for definition in eligible:
        cursor += definition.probability_weight
        if pick < cursor:
            return definition
    return eligible[-1]


def start_event(bar_id: int, definition: EventDefinition, now: Optional[datetime] = None) -> ActiveEvent:
    now = now or timezone.now()
    ends_at = now + timedelta(seconds=definition.duration_seconds)
    return ActiveEvent.objects.create(
        bar_id=bar_id,
        definition=definition,
        starts_at=now,
        ends_at=ends_at,
        is_active=True,
    )


def end_expired_events(bar_id: int, now: Optional[datetime] = None) -> List[ActiveEvent]:
    now = now or timezone.now()
    expired = list(
        ActiveEvent.objects.filter(bar_id=bar_id, is_active=True, ends_at__lte=now).select_related("definition")
    )
    for event in expired:
        event.is_active = False
        event.save(update_fields=["is_active"])
    return expired


def roll_event_for_bar(
    bar_id: int,
    rng: Optional[random.Random] = None,
    now: Optional[datetime] = None,
) -> Optional[ActiveEvent]:
    now = now or timezone.now()
    end_expired_events(bar_id, now=now)
    if ActiveEvent.objects.filter(bar_id=bar_id, is_active=True, starts_at__lte=now, ends_at__gt=now).exists():
        return None
    definition = select_event(bar_id, rng=rng, now=now)
    if not definition:
        return None
    return start_event(bar_id, definition, now=now)


def compute_event_multiplier(active_event: ActiveEvent, drink_id: int, now: Optional[datetime] = None) -> float:
    now = now or timezone.now()
    definition = active_event.definition
    params = definition.params or {}
    try:
        start_multiplier = float(params.get("start_multiplier", 1.0))
    except (TypeError, ValueError):
        start_multiplier = 1.0
    duration = definition.duration_seconds
    if duration <= 0:
        return start_multiplier
    elapsed = max(0.0, (now - active_event.starts_at).total_seconds())
    progress = min(elapsed / duration, 1.0)
    current = start_multiplier + (1.0 - start_multiplier) * progress
    if definition.type == "FOCUS":
        target_ids = _normalize_target_ids(params.get("target_drink_ids"))
        if target_ids and drink_id not in target_ids:
            return 1.0
    return current


def serialize_active_event(active_event: ActiveEvent) -> dict:
    definition = active_event.definition
    return {
        "event_id": active_event.id,
        "definition_id": definition.id,
        "definition_name": definition.name,
        "event_type": definition.type,
        "starts_at": active_event.starts_at.isoformat(),
        "ends_at": active_event.ends_at.isoformat(),
        "params": definition.params,
    }


def _is_in_cooldown(definition: EventDefinition, bar_id: int, now: datetime) -> bool:
    cooldown = definition.cooldown_seconds
    if not cooldown:
        return False
    last_event = ActiveEvent.objects.filter(bar_id=bar_id, definition=definition).order_by("-ends_at").first()
    if not last_event:
        return False
    available_at = last_event.ends_at + timedelta(seconds=cooldown)
    return available_at > now


def _normalize_target_ids(raw: Optional[List[object]]) -> Set[int]:
    if not raw:
        return set()
    normalized: Set[int] = set()
    for item in raw:
        try:
            normalized.add(int(item))
        except (TypeError, ValueError):
            continue
    return normalized
