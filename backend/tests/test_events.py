import random
from datetime import timedelta

import pytest
from django.utils import timezone

from bars.models import Bar
from events.models import EventDefinition
from events.services import end_expired_events, roll_event_for_bar, select_event, start_event
from market.services import get_effective_multiplier


@pytest.mark.django_db
def test_select_event_respects_weights():
    bar = Bar.objects.create(slug="weight", name="Weighted Bar")
    EventDefinition.objects.create(
        name="Light",
        type="BOOM",
        probability_weight=1,
        duration_seconds=30,
    )
    EventDefinition.objects.create(
        name="Heavy",
        type="BOOM",
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
        name="Short Event",
        type="BOOM",
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
        name="Focus Boost",
        type="FOCUS",
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
