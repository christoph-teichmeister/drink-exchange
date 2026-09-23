import contextlib
import json
import random
from decimal import Decimal
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from bars.models import Bar, BarAssignment
from market import tasks as market_tasks
from market.models import Drink, Trade
from market.services import trading

pytestmark = pytest.mark.django_db


@pytest.fixture
def bar() -> Bar:
    return Bar.objects.create(
        slug="trade-bar",
        name="Trade Bar",
        impulse_factor=Decimal("1.000"),
        normalization_factor=Decimal("0.500"),
    )


def _drink(bar: Bar, name: str, weight: str = "1", **overrides) -> Drink:
    values = {
        "base_price": Decimal("10.00"),
        "current_price": Decimal("10.00"),
        "min_price": Decimal("5.00"),
        "max_price": Decimal("20.00"),
        "volatility": Decimal("0.05"),
        "weight": Decimal(weight),
        "rounding_step": Decimal("0.01"),
    }
    values.update(overrides)
    return Drink.objects.create(bar=bar, name=name, **values)


def test_trade_raises_the_purchased_drink_by_the_impulse(bar: Bar):
    lager = _drink(bar, "Lager")

    trade, _drinks = trading.apply_trade(bar, lager, 2)

    lager.refresh_from_db()
    # impulse = qty 2 * volatility 0.05 * impulse_factor 1 * base 10.00 = 1.00
    assert lager.current_price == Decimal("11.00")
    assert trade.price == Decimal("10.00")
    assert trade.qty == 2
    assert trade.bar == bar


def test_normalization_lowers_other_drinks_proportionally_to_weight(bar: Bar):
    lager = _drink(bar, "Lager")
    stout = _drink(bar, "Stout", weight="1")
    cider = _drink(bar, "Cider", weight="3")

    trading.apply_trade(bar, lager, 2)

    stout.refresh_from_db()
    cider.refresh_from_db()
    # Total offset = impulse 1.00 * normalization 0.5 = 0.50, split 1:3.
    assert stout.current_price == Decimal("9.88")  # 10 - 0.125, rounded to 0.01
    assert cider.current_price == Decimal("9.63")  # 10 - 0.375 = 9.625, rounded half-up
    total_drop = (Decimal("10.00") - stout.current_price) + (Decimal("10.00") - cider.current_price)
    assert abs(total_drop - Decimal("0.50")) <= Decimal("0.01")


def test_single_drink_bar_has_no_normalization(bar: Bar):
    lager = _drink(bar, "Lager")

    trading.apply_trade(bar, lager, 1)

    lager.refresh_from_db()
    assert lager.current_price == Decimal("10.50")


def test_zero_weights_skip_normalization(bar: Bar):
    lager = _drink(bar, "Lager")
    water = _drink(bar, "Water", weight="0")

    trading.apply_trade(bar, lager, 1)

    water.refresh_from_db()
    assert water.current_price == Decimal("10.00")


def test_prices_are_rounded_then_clamped_to_bounds(bar: Bar):
    lager = _drink(bar, "Lager", max_price=Decimal("10.40"), rounding_step=Decimal("0.50"))
    stout = _drink(bar, "Stout", min_price=Decimal("9.99"), rounding_step=Decimal("0.50"))

    trading.apply_trade(bar, lager, 20)

    lager.refresh_from_db()
    stout.refresh_from_db()
    assert lager.current_price == Decimal("10.40")
    # 10 - 5.00 = 5.00 rounds to 5.00, then clamps up to min 9.99.
    assert stout.current_price == Decimal("9.99")


def test_rejects_drinks_of_other_bars_and_bad_quantities(bar: Bar):
    other_bar = Bar.objects.create(slug="other", name="Other")
    foreign = _drink(other_bar, "Foreign")
    lager = _drink(bar, "Lager")

    with pytest.raises(Drink.DoesNotExist):
        trading.apply_trade(bar, foreign, 1)
    with pytest.raises(ValueError):
        trading.apply_trade(bar, lager, 0)
    assert Trade.objects.count() == 0


def test_trade_broadcasts_prices_to_the_slug_group_after_commit(bar: Bar, django_capture_on_commit_callbacks):
    lager = _drink(bar, "Lager")

    with (
        mock.patch.object(trading, "broadcast_prices") as broadcast,
        django_capture_on_commit_callbacks(execute=True),
    ):
        trading.apply_trade(bar, lager, 1)

    broadcast.assert_called_once()
    group_key, payload = broadcast.call_args.args
    assert group_key == bar.slug
    assert payload["type"] == "prices.update"
    assert payload["payload"]["prices"][0]["price"] == "10.50"


def test_random_trades_and_ticks_keep_prices_within_bounds(bar: Bar, monkeypatch):
    monkeypatch.setattr(market_tasks, "bar_lock", lambda *_: contextlib.nullcontext())
    drinks = [
        _drink(bar, f"Drink {index}", weight=str(index + 1), volatility=Decimal("0.15"), rounding_step=Decimal("0.05"))
        for index in range(4)
    ]
    rng = random.Random(7)
    for step in range(60):
        trading.apply_trade(bar, rng.choice(drinks), rng.randint(1, 10))
        if step % 3 == 0:
            Bar.objects.filter(pk=bar.pk).update(last_tick_at=None)
            market_tasks.market_tick(bar.pk)
    for drink in Drink.objects.filter(bar=bar):
        assert drink.min_price <= drink.current_price <= drink.max_price


class TestTradeEndpoint:
    @pytest.fixture
    def user(self, bar: Bar):
        user = get_user_model().objects.create_user(username="bartender", password="secret-pass")
        BarAssignment.objects.create(user=user, bar=bar)
        return user

    @staticmethod
    def _post(client: Client, bar: Bar, payload, content_type: str = "application/json"):
        body = json.dumps(payload) if content_type == "application/json" else payload
        return client.post(f"/api/bars/{bar.slug}/trades/", data=body, content_type=content_type)

    def test_records_trade_and_returns_new_prices(self, client: Client, user, bar: Bar):
        lager = _drink(bar, "Lager")
        _drink(bar, "Stout")
        client.force_login(user)

        response = self._post(client, bar, {"drink_id": lager.pk, "qty": 2})

        assert response.status_code == 201
        body = response.json()
        assert body["trade"]["drink_id"] == lager.pk
        assert body["trade"]["price"] == 10.0
        prices = {entry["name"]: entry["price"] for entry in body["drinks"]}
        assert prices == {"Lager": 11.0, "Stout": 9.5}

    @pytest.mark.parametrize("qty", [0, -1, "abc", True, 1.5, None])
    def test_rejects_invalid_quantities(self, client: Client, user, bar: Bar, qty):
        lager = _drink(bar, "Lager")
        client.force_login(user)
        assert self._post(client, bar, {"drink_id": lager.pk, "qty": qty}).status_code == 400
        assert Trade.objects.count() == 0

    def test_rejects_drinks_of_other_bars(self, client: Client, user, bar: Bar):
        foreign = _drink(Bar.objects.create(slug="other", name="Other"), "Foreign")
        client.force_login(user)
        assert self._post(client, bar, {"drink_id": foreign.pk, "qty": 1}).status_code == 400

    def test_requires_authentication(self, client: Client, bar: Bar):
        lager = _drink(bar, "Lager")
        assert self._post(client, bar, {"drink_id": lager.pk, "qty": 1}).status_code == 401

    def test_requires_bar_assignment(self, client: Client, bar: Bar):
        lager = _drink(bar, "Lager")
        outsider = get_user_model().objects.create_user(username="outsider", password="secret-pass")
        client.force_login(outsider)
        assert self._post(client, bar, {"drink_id": lager.pk, "qty": 1}).status_code == 403

    def test_rejects_non_json_bodies(self, client: Client, user, bar: Bar):
        lager = _drink(bar, "Lager")
        client.force_login(user)
        response = client.post(f"/api/bars/{bar.slug}/trades/", {"drink_id": lager.pk, "qty": 1})
        assert response.status_code == 415

    def test_rejects_get(self, client: Client, user, bar: Bar):
        client.force_login(user)
        assert client.get(f"/api/bars/{bar.slug}/trades/").status_code == 405


def test_admin_trade_creation_applies_the_market_logic(admin_client: Client, bar: Bar):
    lager = _drink(bar, "Lager")
    stout = _drink(bar, "Stout")

    response = admin_client.post("/admin/market/trade/add/", {"drink": lager.pk, "qty": 2})

    assert response.status_code == 302
    trade = Trade.objects.get()
    assert (trade.bar, trade.price, trade.qty) == (bar, Decimal("10.00"), 2)
    lager.refresh_from_db()
    stout.refresh_from_db()
    assert lager.current_price == Decimal("11.00")
    assert stout.current_price == Decimal("9.50")
