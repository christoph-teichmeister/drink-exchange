import random
from datetime import timedelta
from unittest import mock

import pytest
from django.utils import timezone

from bars.models import Bar
from events import tasks
from events.models import EventDefinition
from events.services import end_expired_events, roll_event_for_bar, select_event, start_event
from market.services import get_effective_multiplier


@pytest.mark.django_db
def test_select_event_respects_weights():
    bar = Bar.objects.create(slug="weight", name="Weighted Bar")
    EventDefinition.objects.create(
        bar=bar,
        name="Light",
        type=EventDefinition.EventType.BOOM,
        probability_weight=1,
        duration_seconds=30,
    )
    EventDefinition.objects.create(
        bar=bar,
        name="Heavy",
        type=EventDefinition.EventType.BOOM,
        probability_weight=3,
        duration_seconds=30,
    )
    rng = random.Random(0)
    selected = select_event(bar.id, rng=rng)
    assert selected is not None
    assert selected.name == "Heavy"


@pytest.mark.django_db
def test_roll_event_starts_and_finishes():
    bar = Bar.objects.create(slug="roll", name="Roller")
    EventDefinition.objects.create(
        bar=bar,
        name="Short Event",
        type=EventDefinition.EventType.BOOM,
        probability_weight=1,
        duration_seconds=1,
    )
    event = roll_event_for_bar(bar.id, rng=random.Random(0))
    assert event is not None
    assert event.is_active
    assert event.bar_id == bar.id
    ended = end_expired_events(bar.id, now=event.ends_at + timedelta(seconds=1))
    assert any(ended_event.id == event.id for ended_event in ended)
    event.refresh_from_db()
    assert not event.is_active


@pytest.mark.django_db
def test_multiplier_decay_focus_and_global():
    bar = Bar.objects.create(slug="decay", name="Decay")
    drink = bar.drinks.create(name="Tonic", base_price="1.00")
    definition = EventDefinition.objects.create(
        bar=bar,
        name="Focus Boost",
        type=EventDefinition.EventType.FOCUS,
        probability_weight=1,
        duration_seconds=10,
        params={
            "start_multiplier": 2.0,
            "target_drink_ids": [drink.id],
        },
    )
    start = timezone.now() - timedelta(seconds=5)
    event = start_event(bar.id, definition, now=start)
    mid = start + timedelta(seconds=5)
    assert get_effective_multiplier(bar.id, drink.id, now=start) == pytest.approx(2.0)
    assert get_effective_multiplier(bar.id, drink.id, now=mid) == pytest.approx(1.5)
    assert get_effective_multiplier(bar.id, drink.id, now=event.ends_at) == pytest.approx(1.0)
    other_drink = bar.drinks.create(name="Lemon", base_price="1.00")
    assert get_effective_multiplier(bar.id, other_drink.id, now=mid) == pytest.approx(1.0)


@pytest.mark.django_db
def test_select_event_ignores_other_bars_definitions():
    bar = Bar.objects.create(slug="own", name="Own Bar")
    other_bar = Bar.objects.create(slug="other", name="Other Bar")
    EventDefinition.objects.create(
        bar=other_bar,
        name="Foreign",
        type=EventDefinition.EventType.BOOM,
        probability_weight=100,
        duration_seconds=30,
    )
    assert select_event(bar.id, rng=random.Random(0)) is None
    EventDefinition.objects.create(
        bar=bar,
        name="Own",
        type=EventDefinition.EventType.BOOM,
        probability_weight=1,
        duration_seconds=30,
    )
    for seed in range(20):
        assert select_event(bar.id, rng=random.Random(seed)).name == "Own"


@pytest.mark.django_db
def test_event_roll_broadcasts_end_of_expired_event():
    bar = Bar.objects.create(slug="broadcast", name="Broadcast Bar")
    definition = EventDefinition.objects.create(
        bar=bar,
        name="Expiring",
        type=EventDefinition.EventType.BOOM,
        probability_weight=1,
        duration_seconds=1,
        cooldown_seconds=3600,
    )
    expired = start_event(bar.id, definition, now=timezone.now() - timedelta(seconds=10))
    with mock.patch.object(tasks, "_broadcast_event") as broadcast:
        tasks.event_roll(bar.id)
    ended_calls = [call for call in broadcast.call_args_list if call.args[1] == "event.ended"]
    assert len(ended_calls) == 1
    assert ended_calls[0].args[2]["event_id"] == expired.id
