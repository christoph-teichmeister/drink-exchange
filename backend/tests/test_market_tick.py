import contextlib
from datetime import timedelta
from decimal import Decimal
from unittest import mock

import pytest
from django.utils import timezone

from bars.models import Bar
from events.models import EventDefinition
from events.services import start_event
from market import tasks as market_tasks
from market.models import Drink, PricePoint


@pytest.mark.django_db
def test_market_tick_applies_reversion_and_records_price_points(monkeypatch):
    bar = Bar.objects.create(slug="main", name="Main Bar", reversion_rate=Decimal("0.200"))
    Drink.objects.create(
        bar=bar,
        name="Reverting Lager",
        base_price=Decimal("100.00"),
        current_price=Decimal("80.00"),
        min_price=Decimal("50.00"),
        max_price=Decimal("200.00"),
        rounding_step=Decimal("0.05"),
    )
    monkeypatch.setattr(market_tasks, "bar_lock", lambda *_: contextlib.nullcontext())

    ran = market_tasks.market_tick(bar.id)

    drink = Drink.objects.get(bar=bar)
    assert ran is True
    assert drink.current_price == Decimal("84.00")
    assert PricePoint.objects.filter(bar=bar, drink=drink).count() == 1


@pytest.mark.django_db
def test_market_tick_rounds_to_configured_step(monkeypatch):
    bar = Bar.objects.create(slug="round", name="Rounded Bar")
    Drink.objects.create(
        bar=bar,
        name="Precise Bitter",
        base_price=Decimal("100.00"),
        current_price=Decimal("99.30"),
        min_price=Decimal("90.00"),
        max_price=Decimal("110.00"),
        rounding_step=Decimal("0.25"),
    )
    monkeypatch.setattr(market_tasks, "bar_lock", lambda *_: contextlib.nullcontext())

    market_tasks.market_tick(bar.id)

    drink = Drink.objects.get(bar=bar)
    assert drink.current_price == Decimal("99.25")


@pytest.mark.django_db
def test_market_tick_clamps_price_within_bounds():
    bar = Bar.objects.create(slug="clamp", name="Clamped Bar")
    drink = Drink(
        bar=bar,
        name="Wild IPA",
        base_price=Decimal("200.00"),
        current_price=Decimal("500.00"),
        min_price=Decimal("90.00"),
        max_price=Decimal("110.00"),
    )
    next_price = market_tasks._calculate_next_price(drink, bar.reversion_rate)
    assert next_price == Decimal("110.00")


@pytest.mark.django_db
def test_market_tick_respects_bar_lock():
    bar = Bar.objects.create(slug="locked", name="Locked Bar")
    drink = Drink.objects.create(
        bar=bar,
        name="Locked Porter",
        base_price=Decimal("100.00"),
        current_price=Decimal("80.00"),
        min_price=Decimal("0.01"),
    )

    with market_tasks.bar_lock(bar.id):
        ran = market_tasks.market_tick(bar.id)

    drink.refresh_from_db()
    assert ran is False
    assert drink.current_price == Decimal("80.00")


def test_rounding_never_pushes_price_below_min_price():
    bar = Bar(slug="edge", name="Edge Bar")
    drink = Drink(
        bar=bar,
        name="Edge Cider",
        base_price=Decimal("1.01"),
        current_price=Decimal("1.01"),
        min_price=Decimal("1.01"),
        max_price=Decimal("5.00"),
        rounding_step=Decimal("0.50"),
    )
    # Rounding 1.01 to a 0.50 step yields 1.00, which would violate the min_price constraint.
    assert market_tasks._calculate_next_price(drink, Decimal("0.100")) == Decimal("1.01")


@pytest.mark.django_db
def test_market_tick_applies_active_event_multiplier(monkeypatch):
    bar = Bar.objects.create(slug="boom", name="Boom Bar", reversion_rate=Decimal("0.500"))
    drink = Drink.objects.create(
        bar=bar,
        name="Boom Lager",
        base_price=Decimal("10.00"),
        current_price=Decimal("10.00"),
        min_price=Decimal("1.00"),
        max_price=Decimal("50.00"),
        rounding_step=Decimal("0.01"),
    )
    definition = EventDefinition.objects.create(
        bar=bar,
        name="Boom",
        type=EventDefinition.EventType.BOOM,
        probability_weight=1,
        duration_seconds=600,
        params={"start_multiplier": 2.0},
    )
    start_event(bar.id, definition, now=timezone.now() - timedelta(seconds=1))
    monkeypatch.setattr(market_tasks, "bar_lock", lambda *_: contextlib.nullcontext())

    assert market_tasks.market_tick(bar.id) is True

    drink.refresh_from_db()
    # Target is ~base * 2 = ~20.00; half the gap is closed in one tick.
    assert Decimal("14.90") <= drink.current_price <= Decimal("15.00")


@pytest.mark.django_db
def test_market_tick_all_bars_enqueues_one_task_per_due_bar():
    # Bars seeded by data migrations (e.g. `ci-demo` when CI is set) must not count as due.
    Bar.objects.update(last_tick_at=timezone.now())
    due = Bar.objects.create(slug="due", name="Due Bar")
    Bar.objects.create(slug="fresh", name="Fresh Bar", last_tick_at=timezone.now())
    with mock.patch.object(market_tasks.market_tick, "delay") as delay:
        market_tasks.market_tick_all_bars()
    delay.assert_called_once_with(due.pk)
