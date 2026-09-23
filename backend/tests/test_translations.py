import json
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from bars.models import Bar, BarAssignment
from market.models import Drink

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("compiled_messages")]


@pytest.fixture
def bar() -> Bar:
    return Bar.objects.create(slug="i18n-bar", name="I18n Bar")


@pytest.fixture
def drink(bar: Bar) -> Drink:
    return Drink.objects.create(
        bar=bar,
        name="Lager",
        base_price=Decimal("5.00"),
        min_price=Decimal("3.00"),
        max_price=Decimal("9.00"),
    )


def _client(bar: Bar, role: str = BarAssignment.Role.MANAGER) -> Client:
    user = get_user_model().objects.create_user(username=f"user-{role}", password="pw")
    BarAssignment.objects.create(user=user, bar=bar, role=role)
    client = Client()
    client.force_login(user)
    return client


def _post_json(client: Client, url: str, payload: dict, **headers):
    return client.post(url, data=json.dumps(payload), content_type="application/json", **headers)


@pytest.mark.parametrize(
    ("language", "expected"),
    [
        ("de", "Die Menge muss eine ganze Zahl von mindestens 1 sein."),
        ("en", "Quantity must be a whole number of at least 1."),
    ],
)
def test_trade_errors_follow_accept_language(bar: Bar, drink: Drink, language: str, expected: str):
    client = _client(bar, BarAssignment.Role.OPERATOR)

    response = _post_json(
        client, f"/api/bars/{bar.slug}/trades/", {"drink_id": drink.pk, "qty": 0}, HTTP_ACCEPT_LANGUAGE=language
    )

    assert response.status_code == 400
    assert response.json()["detail"] == expected


def test_drink_bound_errors_are_german(bar: Bar, drink: Drink):
    client = _client(bar)

    response = client.patch(
        f"/api/bars/{bar.slug}/drinks/{drink.pk}/",
        data=json.dumps({"min_price": 6}),
        content_type="application/json",
        HTTP_ACCEPT_LANGUAGE="de",
    )

    assert response.status_code == 400
    body = response.json()
    assert body["detail"] == "Bitte die markierten Felder korrigieren."
    assert body["errors"]["base_price"] == ["Der Basispreis muss zwischen Mindest- und Höchstpreis liegen."]


def test_language_cookie_wins_over_accept_language(bar: Bar):
    client = _client(bar, BarAssignment.Role.OPERATOR)
    client.cookies["django_language"] = "de"

    response = client.get(f"/api/bars/{bar.slug}/settings/", HTTP_ACCEPT_LANGUAGE="en")

    assert response.status_code == 403
    assert response.json()["detail"] == "Nur Manager der Bar können die Marktkonfiguration ändern."


def test_auth_errors_are_german():
    response = _post_json(Client(), "/api/auth/login/", {"username": "x"}, HTTP_ACCEPT_LANGUAGE="de")

    assert response.status_code == 400
    assert response.json()["detail"] == "Benutzername und Passwort sind erforderlich."


def test_admin_shows_german_model_and_field_names(admin_client: Client):
    response = admin_client.get("/admin/market/drink/add/", HTTP_ACCEPT_LANGUAGE="de")

    assert response.status_code == 200
    content = response.content.decode()
    assert "Getränk hinzufügen" in content
    for label in ("Basispreis", "Mindestpreis", "Höchstpreis", "Rundungsschritt", "Volatilität"):
        assert label in content
