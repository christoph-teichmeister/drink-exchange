import json
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from bars.models import Bar, BarAssignment
from market.models import Drink, PricePoint

pytestmark = pytest.mark.django_db


@pytest.fixture
def user():
    return get_user_model().objects.create_user(username="bartender", password="secret-pass")


@pytest.fixture
def bar() -> Bar:
    return Bar.objects.create(slug="api-bar", name="API Bar")


def _post_json(client: Client, url: str, payload: dict):
    return client.post(url, data=json.dumps(payload), content_type="application/json")


def test_login_with_json_sets_session(client: Client, user):
    response = _post_json(client, "/api/auth/login/", {"username": "bartender", "password": "secret-pass"})
    assert response.status_code == 200
    assert response.json()["username"] == "bartender"
    assert client.get("/api/auth/me/").status_code == 200


def test_login_rejects_form_encoded_bodies(client: Client, user):
    # Plain HTML forms can be submitted cross-site; only JSON (which needs a CORS preflight) is accepted.
    response = client.post("/api/auth/login/", {"username": "bartender", "password": "secret-pass"})
    assert response.status_code == 415
    assert client.get("/api/auth/me/").status_code == 401


def test_login_rejects_invalid_credentials(client: Client, user):
    response = _post_json(client, "/api/auth/login/", {"username": "bartender", "password": "wrong"})
    assert response.status_code == 400


def test_login_rejects_inactive_users(client: Client, user):
    user.is_active = False
    user.save()
    response = _post_json(client, "/api/auth/login/", {"username": "bartender", "password": "secret-pass"})
    assert response.status_code == 400


def test_logout_clears_session(client: Client, user):
    client.force_login(user)
    assert client.post("/api/auth/logout/").status_code == 200
    assert client.get("/api/auth/me/").status_code == 401


def test_set_language_sets_cookie_for_supported_language(client: Client):
    response = _post_json(client, "/api/locale/", {"language": "de-DE"})
    assert response.status_code == 200
    assert response.json() == {"language": "de"}
    assert response.cookies["django_language"].value == "de"


def test_set_language_falls_back_to_default(client: Client):
    response = _post_json(client, "/api/locale/", {"language": "xx"})
    assert response.json() == {"language": "en"}


def test_set_language_rejects_form_bodies(client: Client):
    assert client.post("/api/locale/", {"language": "de"}).status_code == 415


def test_bar_list_only_returns_assigned_bars(client: Client, user, bar: Bar):
    Bar.objects.create(slug="other", name="Other Bar")
    BarAssignment.objects.create(user=user, bar=bar)
    client.force_login(user)
    response = client.get("/api/bars/")
    assert [entry["slug"] for entry in response.json()["bars"]] == ["api-bar"]


def test_market_snapshot_requires_authentication(client: Client, bar: Bar):
    assert client.get(f"/api/bars/{bar.slug}/market/").status_code == 401


def test_market_snapshot_requires_assignment(client: Client, user, bar: Bar):
    client.force_login(user)
    assert client.get(f"/api/bars/{bar.slug}/market/").status_code == 403


def test_market_snapshot_rejects_unsafe_methods(client: Client, user, bar: Bar):
    BarAssignment.objects.create(user=user, bar=bar)
    client.force_login(user)
    assert client.post(f"/api/bars/{bar.slug}/market/").status_code == 405


def test_market_snapshot_uses_current_price_and_price_points(client: Client, user, bar: Bar):
    BarAssignment.objects.create(user=user, bar=bar)
    drink = Drink.objects.create(
        bar=bar,
        name="Snapshot Stout",
        base_price=Decimal("5.00"),
        current_price=Decimal("6.00"),
        min_price=Decimal("1.00"),
        max_price=Decimal("10.00"),
    )
    now = timezone.now()
    for offset in range(30):
        PricePoint.objects.create(
            bar=bar, drink=drink, price=Decimal("5.50"), recorded_at=now - timedelta(seconds=30 - offset)
        )
    PricePoint.objects.create(bar=bar, drink=drink, price=Decimal("6.00"), recorded_at=now)
    client.force_login(user)

    payload = client.get(f"/api/bars/{bar.slug}/market/").json()

    entry = payload["drinks"][0]
    # Same source of truth as the WebSocket feed (current_price), not the last trade.
    assert entry["price"] == 6.0
    assert entry["trend"] == "up"
    assert entry["delta"] == pytest.approx(0.5)
    assert len(entry["history"]) == 24
    assert entry["history"][-1]["price"] == 6.0
