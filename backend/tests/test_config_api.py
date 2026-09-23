import json
from decimal import Decimal
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from bars import config_views
from bars.models import Bar, BarAssignment
from events.models import EventDefinition
from market.models import Drink, Trade

pytestmark = pytest.mark.django_db

Role = BarAssignment.Role


@pytest.fixture
def bar() -> Bar:
    return Bar.objects.create(slug="config-bar", name="Config Bar")


@pytest.fixture
def other_bar() -> Bar:
    return Bar.objects.create(slug="other-bar", name="Other Bar")


@pytest.fixture
def drink(bar: Bar) -> Drink:
    return Drink.objects.create(
        bar=bar,
        name="Lager",
        base_price=Decimal("5.00"),
        current_price=Decimal("6.00"),
        min_price=Decimal("3.00"),
        max_price=Decimal("9.00"),
    )


@pytest.fixture
def definition(bar: Bar) -> EventDefinition:
    return EventDefinition.objects.create(
        bar=bar, name="Boom", type=EventDefinition.EventType.BOOM, duration_seconds=60, params={"start_multiplier": 1.5}
    )


def _client_for(bar: Bar | None, role: str | None, username: str = "user", superuser: bool = False) -> Client:
    user_model = get_user_model()
    user = (
        user_model.objects.create_superuser(username=username, password="pw", email=f"{username}@example.com")
        if superuser
        else user_model.objects.create_user(username=username, password="pw")
    )
    if bar is not None and role is not None:
        BarAssignment.objects.create(user=user, bar=bar, role=role)
    client = Client()
    client.force_login(user)
    return client


def _json(client: Client, method: str, url: str, payload=None):
    if method == "get":
        return client.get(url)
    body = json.dumps(payload or {})
    return getattr(client, method)(url, data=body, content_type="application/json")


ENDPOINTS = [
    ("get", "/api/bars/{slug}/settings/"),
    ("patch", "/api/bars/{slug}/settings/"),
    ("get", "/api/bars/{slug}/drinks/"),
    ("post", "/api/bars/{slug}/drinks/"),
    ("patch", "/api/bars/{slug}/drinks/{drink}/"),
    ("delete", "/api/bars/{slug}/drinks/{drink}/"),
    ("get", "/api/bars/{slug}/events/"),
    ("post", "/api/bars/{slug}/events/"),
    ("patch", "/api/bars/{slug}/events/{event}/"),
    ("delete", "/api/bars/{slug}/events/{event}/"),
]


@pytest.mark.parametrize(("method", "template"), ENDPOINTS)
def test_role_matrix(bar: Bar, other_bar: Bar, drink: Drink, definition: EventDefinition, method, template):
    url = template.format(slug=bar.slug, drink=drink.pk, event=definition.pk)

    assert _json(Client(), method, url).status_code == 401
    assert _json(_client_for(other_bar, Role.MANAGER, "foreign"), method, url).status_code == 403
    assert _json(_client_for(bar, Role.OPERATOR, "operator"), method, url).status_code == 403
    missing = template.format(slug="missing", drink=drink.pk, event=definition.pk)
    assert _json(_client_for(bar, Role.MANAGER, "manager-404"), method, missing).status_code == 404


def test_superusers_are_managers_of_assigned_bars(bar: Bar):
    client = _client_for(bar, Role.OPERATOR, "root", superuser=True)
    assert client.get(f"/api/bars/{bar.slug}/settings/").status_code == 200
    assert client.get("/api/bars/").json()["bars"][0]["role"] == "manager"


def test_bar_list_exposes_the_role(bar: Bar):
    client = _client_for(bar, Role.OPERATOR, "operator")
    assert client.get("/api/bars/").json()["bars"][0]["role"] == "operator"


def test_write_endpoints_require_json(bar: Bar, drink: Drink):
    client = _client_for(bar, Role.MANAGER, "manager")
    response = client.patch(f"/api/bars/{bar.slug}/settings/", data="name=x", content_type="text/plain")
    assert response.status_code == 415
    assert client.post(f"/api/bars/{bar.slug}/drinks/", {"name": "x"}).status_code == 415


class TestSettings:
    def test_read_and_partial_update(self, bar: Bar):
        client = _client_for(bar, Role.MANAGER, "manager")

        assert client.get(f"/api/bars/{bar.slug}/settings/").json()["impulse_factor"] == 1.0
        response = _json(
            client, "patch", f"/api/bars/{bar.slug}/settings/", {"impulse_factor": 1.5, "reversion_rate": "0.2"}
        )

        assert response.status_code == 200
        bar.refresh_from_db()
        assert bar.impulse_factor == Decimal("1.500")
        assert bar.reversion_rate == Decimal("0.200")
        assert bar.name == "Config Bar"

    def test_rejects_invalid_values_per_field(self, bar: Bar):
        client = _client_for(bar, Role.MANAGER, "manager")

        response = _json(
            client,
            "patch",
            f"/api/bars/{bar.slug}/settings/",
            {"normalization_factor": 2, "impulse_factor": -1, "tick_interval_seconds": 0},
        )

        assert response.status_code == 400
        assert set(response.json()["errors"]) == {"normalization_factor", "impulse_factor", "tick_interval_seconds"}


class TestDrinks:
    def test_create_sets_current_price_and_broadcasts(self, bar: Bar, django_capture_on_commit_callbacks):
        client = _client_for(bar, Role.MANAGER, "manager")

        with (
            mock.patch.object(config_views, "broadcast_bar_prices") as broadcast,
            django_capture_on_commit_callbacks(execute=True),
        ):
            response = _json(
                client,
                "post",
                f"/api/bars/{bar.slug}/drinks/",
                {"name": "Cider", "base_price": 4.5, "min_price": 2, "max_price": 8},
            )

        assert response.status_code == 201
        cider = Drink.objects.get(bar=bar, name="Cider")
        assert cider.current_price == Decimal("4.50")
        broadcast.assert_called_once_with(bar)

    def test_bounds_are_validated(self, bar: Bar, drink: Drink):
        client = _client_for(bar, Role.MANAGER, "manager")

        response = _json(client, "patch", f"/api/bars/{bar.slug}/drinks/{drink.pk}/", {"min_price": 6, "base_price": 5})

        assert response.status_code == 400
        assert "base_price" in response.json()["errors"]
        drink.refresh_from_db()
        assert drink.min_price == Decimal("3.00")

    def test_bound_change_clamps_the_live_price_and_broadcasts(
        self, bar: Bar, drink: Drink, django_capture_on_commit_callbacks
    ):
        client = _client_for(bar, Role.MANAGER, "manager")

        with (
            mock.patch.object(config_views, "broadcast_bar_prices") as broadcast,
            django_capture_on_commit_callbacks(execute=True),
        ):
            response = _json(client, "patch", f"/api/bars/{bar.slug}/drinks/{drink.pk}/", {"max_price": 5.5})

        assert response.status_code == 200
        drink.refresh_from_db()
        assert drink.max_price == Decimal("5.50")
        assert drink.current_price == Decimal("5.50")
        broadcast.assert_called_once_with(bar)

    def test_delete_is_blocked_while_trades_exist(self, bar: Bar, drink: Drink):
        client = _client_for(bar, Role.MANAGER, "manager")
        Trade.objects.create(bar=bar, drink=drink, price=Decimal("5.00"), qty=1)

        response = client.delete(f"/api/bars/{bar.slug}/drinks/{drink.pk}/")

        assert response.status_code == 409
        assert Drink.objects.filter(pk=drink.pk).exists()

    def test_delete_without_trades(self, bar: Bar, drink: Drink):
        client = _client_for(bar, Role.MANAGER, "manager")
        assert client.delete(f"/api/bars/{bar.slug}/drinks/{drink.pk}/").status_code == 204
        assert not Drink.objects.filter(pk=drink.pk).exists()

    def test_other_bars_drinks_are_not_reachable(self, bar: Bar, other_bar: Bar):
        foreign = Drink.objects.create(bar=other_bar, name="Foreign", base_price=Decimal("5.00"))
        client = _client_for(bar, Role.MANAGER, "manager")

        assert _json(client, "patch", f"/api/bars/{bar.slug}/drinks/{foreign.pk}/", {"name": "x"}).status_code == 404
        assert client.delete(f"/api/bars/{bar.slug}/drinks/{foreign.pk}/").status_code == 404
        assert [entry["name"] for entry in client.get(f"/api/bars/{bar.slug}/drinks/").json()["drinks"]] == []


class TestEvents:
    def test_create_focus_event_with_targets(self, bar: Bar, drink: Drink):
        client = _client_for(bar, Role.MANAGER, "manager")

        response = _json(
            client,
            "post",
            f"/api/bars/{bar.slug}/events/",
            {
                "name": "Lager focus",
                "type": "focus",
                "duration_seconds": 90,
                "probability_weight": 2,
                "params": {"start_multiplier": 1.4, "target_drink_ids": [drink.pk]},
            },
        )

        assert response.status_code == 201
        created = EventDefinition.objects.get(bar=bar, name="Lager focus")
        assert created.params == {"start_multiplier": 1.4, "target_drink_ids": [drink.pk]}

    def test_rejects_targets_from_another_bar(self, bar: Bar, other_bar: Bar):
        foreign = Drink.objects.create(bar=other_bar, name="Foreign", base_price=Decimal("5.00"))
        client = _client_for(bar, Role.MANAGER, "manager")

        response = _json(
            client,
            "post",
            f"/api/bars/{bar.slug}/events/",
            {"name": "Sneaky", "type": "focus", "duration_seconds": 60, "params": {"target_drink_ids": [foreign.pk]}},
        )

        assert response.status_code == 400
        assert "params" in response.json()["errors"]

    @pytest.mark.parametrize(
        "params",
        [{"start_multiplier": 0}, {"start_multiplier": "abc"}, {"start_multiplier": True}, {"rules": 1}, "nope"],
    )
    def test_rejects_invalid_params(self, bar: Bar, definition: EventDefinition, params):
        client = _client_for(bar, Role.MANAGER, "manager")
        response = _json(client, "patch", f"/api/bars/{bar.slug}/events/{definition.pk}/", {"params": params})
        assert response.status_code == 400
        assert "params" in response.json()["errors"]

    def test_non_focus_events_drop_targets(self, bar: Bar, drink: Drink, definition: EventDefinition):
        client = _client_for(bar, Role.MANAGER, "manager")

        response = _json(
            client,
            "patch",
            f"/api/bars/{bar.slug}/events/{definition.pk}/",
            {"params": {"start_multiplier": 1.2, "target_drink_ids": [drink.pk]}},
        )

        assert response.status_code == 200
        definition.refresh_from_db()
        assert definition.params == {"start_multiplier": 1.2}

    def test_duplicate_names_are_rejected(self, bar: Bar, definition: EventDefinition):
        client = _client_for(bar, Role.MANAGER, "manager")
        response = _json(
            client, "post", f"/api/bars/{bar.slug}/events/", {"name": "Boom", "type": "boom", "duration_seconds": 30}
        )
        assert response.status_code == 400
        assert "name" in response.json()["errors"]

    def test_delete(self, bar: Bar, definition: EventDefinition):
        client = _client_for(bar, Role.MANAGER, "manager")
        assert client.delete(f"/api/bars/{bar.slug}/events/{definition.pk}/").status_code == 204
        assert not EventDefinition.objects.filter(pk=definition.pk).exists()
