from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from bars.models import Bar
from events.models import ActiveEvent, EventDefinition
from market.models import Drink, MarketSession, PricePoint, Trade

pytestmark = pytest.mark.django_db


@pytest.fixture
def bar() -> Bar:
    return Bar.objects.create(slug="test-bar", name="Test Bar")


@pytest.fixture
def drink(bar: Bar) -> Drink:
    return Drink.objects.create(
        bar=bar,
        name="Test Lager",
        base_price=Decimal("5.00"),
        min_price=Decimal("3.00"),
        max_price=Decimal("8.00"),
    )


@pytest.fixture
def event_definition(bar: Bar) -> EventDefinition:
    return EventDefinition.objects.create(
        bar=bar,
        name="Flash Boom",
        type=EventDefinition.EventType.BOOM,
        probability_weight=Decimal("1.5"),
        duration_seconds=120,
    )


def test_drink_defaults_current_price_to_base(drink: Drink) -> None:
    assert drink.current_price == drink.base_price


def test_drink_rejects_base_outside_bounds(bar: Bar) -> None:
    drink = Drink(
        bar=bar,
        name="Broken Brew",
        base_price=Decimal("10.00"),
        min_price=Decimal("3.00"),
        max_price=Decimal("9.00"),
    )
    with pytest.raises(ValidationError):
        drink.full_clean()


def test_trade_requires_positive_qty(drink: Drink, bar: Bar) -> None:
    trade = Trade(bar=bar, drink=drink, price=drink.base_price, qty=0)
    with pytest.raises(ValidationError):
        trade.full_clean()


def test_market_session_defaults_to_running(bar: Bar) -> None:
    session = MarketSession.objects.create(bar=bar)
    assert session.status == MarketSession.Status.RUNNING


def test_event_definition_requires_positive_duration(bar: Bar) -> None:
    definition = EventDefinition(
        bar=bar,
        name="Zero Duration",
        type=EventDefinition.EventType.FOCUS,
        probability_weight=Decimal("0.5"),
        duration_seconds=0,
    )
    with pytest.raises(ValidationError):
        definition.full_clean()


def test_active_event_requires_end_after_start(bar: Bar, event_definition: EventDefinition) -> None:
    start = timezone.now()
    active_event = ActiveEvent(
        bar=bar,
        definition=event_definition,
        starts_at=start,
        ends_at=start - timedelta(seconds=10),
    )
    with pytest.raises(ValidationError):
        active_event.full_clean()


def test_price_point_records_time(drink: Drink, bar: Bar) -> None:
    price_point = PricePoint.objects.create(bar=bar, drink=drink, price=drink.base_price)
    assert price_point.recorded_at is not None
