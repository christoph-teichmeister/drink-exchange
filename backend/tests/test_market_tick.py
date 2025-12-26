import contextlib
from decimal import Decimal

import pytest

from bars.models import Bar
from market.models import Drink, PricePoint
from market import tasks as market_tasks


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
def test_market_tick_clamps_price_within_bounds(monkeypatch):
    bar = Bar.objects.create(slug="clamp", name="Clamped Bar")
    Drink.objects.create(
        bar=bar,
        name="Wild IPA",
        base_price=Decimal("100.00"),
        current_price=Decimal("500.00"),
        min_price=Decimal("90.00"),
        max_price=Decimal("110.00"),
    )
    monkeypatch.setattr(market_tasks, "bar_lock", lambda *_: contextlib.nullcontext())

    market_tasks.market_tick(bar.id)

    drink = Drink.objects.get(bar=bar)
    assert drink.current_price == Decimal("90.00")


@pytest.mark.django_db
def test_market_tick_respects_bar_lock():
    bar = Bar.objects.create(slug="locked", name="Locked Bar")
    drink = Drink.objects.create(
        bar=bar,
        name="Locked Porter",
        base_price=Decimal("100.00"),
        current_price=Decimal("80.00"),
    )

    with market_tasks.bar_lock(bar.id):
        ran = market_tasks.market_tick(bar.id)

    drink.refresh_from_db()
    assert ran is False
    assert drink.current_price == Decimal("80.00")
