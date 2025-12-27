import os
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.models import Bar
from market.models import Drink, MarketSession, PricePoint, Trade


def _get_superuser_settings() -> tuple[str, str, str]:
    return (
        os.environ.get("DJANGO_DEV_SUPERUSER_NAME", "admin"),
        os.environ.get("DJANGO_DEV_SUPERUSER_EMAIL", "admin@example.com"),
        os.environ.get("DJANGO_DEV_SUPERUSER_PASSWORD", "admin"),
    )


DEV_BARS = [
    {
        "slug": "riverfront",
        "name": "Riverfront Taproom",
        "description": "A bright community hangout that keeps rotating taps to showcase local breweries.",
    },
    {
        "slug": "north-harbor",
        "name": "North Harbor Pub",
        "description": "An atmospheric space focused on barrel-aged cocktails and small-batch pours.",
    },
]

DEV_DRINKS = [
    {
        "bar_slug": "riverfront",
        "name": "Riverfront Lager",
        "base_price": Decimal("5.50"),
        "current_price": Decimal("5.75"),
        "min_price": Decimal("4.60"),
        "max_price": Decimal("7.00"),
        "volatility": Decimal("0.08"),
        "weight": Decimal("1.00"),
    },
    {
        "bar_slug": "riverfront",
        "name": "Citrus Saison",
        "base_price": Decimal("7.20"),
        "current_price": Decimal("7.20"),
        "min_price": Decimal("6.00"),
        "max_price": Decimal("9.50"),
        "volatility": Decimal("0.12"),
        "weight": Decimal("0.85"),
    },
    {
        "bar_slug": "north-harbor",
        "name": "Harbor Stout",
        "base_price": Decimal("8.10"),
        "current_price": Decimal("8.30"),
        "min_price": Decimal("7.20"),
        "max_price": Decimal("10.50"),
        "volatility": Decimal("0.09"),
        "weight": Decimal("1.10"),
    },
]

DEV_PRICE_POINTS = [
    {"bar_slug": "riverfront", "drink_name": "Riverfront Lager", "price": Decimal("5.75")},
    {"bar_slug": "riverfront", "drink_name": "Citrus Saison", "price": Decimal("7.20")},
    {"bar_slug": "north-harbor", "drink_name": "Harbor Stout", "price": Decimal("8.30")},
]

DEV_TRADES = [
    {
        "bar_slug": "riverfront",
        "drink_name": "Riverfront Lager",
        "price": Decimal("5.75"),
        "qty": 2,
    },
    {
        "bar_slug": "north-harbor",
        "drink_name": "Harbor Stout",
        "price": Decimal("8.30"),
        "qty": 1,
    },
]


def _ensure_superuser() -> None:
    username, email, password = _get_superuser_settings()
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username=username,
        defaults={"email": email, "is_staff": True, "is_superuser": True, "is_active": True},
    )
    needs_save = False
    if not created:
        if not user.is_active:
            user.is_active = True
            needs_save = True
        if not user.is_staff or not user.is_superuser:
            user.is_staff = True
            user.is_superuser = True
            needs_save = True
        if user.email != email:
            user.email = email
            needs_save = True
    if password and (created or not user.check_password(password)):
        user.set_password(password)
        needs_save = True
    if needs_save:
        user.save(update_fields=["email", "is_staff", "is_superuser", "is_active", "password"])


def _ensure_bars() -> dict[str, Bar]:
    bars: dict[str, Bar] = {}
    for data in DEV_BARS:
        bar, _ = Bar.objects.get_or_create(
            slug=data["slug"],
            defaults={"name": data["name"], "description": data["description"]},
        )
        bars[bar.slug] = bar
    return bars


def _ensure_drinks(bars: dict[str, Bar]) -> dict[tuple[str, str], Drink]:
    drinks: dict[tuple[str, str], Drink] = {}
    for data in DEV_DRINKS:
        bar = bars[data["bar_slug"]]
        drink, _ = Drink.objects.update_or_create(
            bar=bar,
            name=data["name"],
            defaults={
                "base_price": data["base_price"],
                "current_price": data["current_price"],
                "min_price": data["min_price"],
                "max_price": data["max_price"],
                "volatility": data["volatility"],
                "weight": data["weight"],
            },
        )
        drinks[(bar.slug, drink.name)] = drink
    return drinks


def _ensure_sessions(bars: dict[str, Bar]) -> None:
    for bar in bars.values():
        session, created = MarketSession.objects.get_or_create(
            bar=bar,
            defaults={
                "status": MarketSession.Status.RUNNING,
                "metadata": {"dev_seed": True},
            },
        )
        if not created and session.status != MarketSession.Status.RUNNING:
            session.status = MarketSession.Status.RUNNING
            session.save(update_fields=["status"])


def _ensure_price_points(drinks: dict[tuple[str, str], Drink]) -> None:
    for entry in DEV_PRICE_POINTS:
        drink = drinks[(entry["bar_slug"], entry["drink_name"])]
        if not PricePoint.objects.filter(bar=drink.bar, drink=drink, price=entry["price"]).exists():
            PricePoint.objects.create(
                bar=drink.bar,
                drink=drink,
                price=entry["price"],
                recorded_at=timezone.now(),
            )


def _ensure_trades(drinks: dict[tuple[str, str], Drink]) -> None:
    for entry in DEV_TRADES:
        drink = drinks[(entry["bar_slug"], entry["drink_name"])]
        if not Trade.objects.filter(bar=drink.bar, drink=drink, price=entry["price"], qty=entry["qty"]).exists():
            Trade.objects.create(
                bar=drink.bar,
                drink=drink,
                price=entry["price"],
                qty=entry["qty"],
                occurred_at=timezone.now(),
            )


class Command(BaseCommand):
    """Ensures default development fixtures exist so the project is immediately usable."""

    help = _("Populates development fixtures (superuser, bars, drinks, price points, trades).")

    def handle(self, *args, **options) -> None:
        _ensure_superuser()
        bars = _ensure_bars()
        drinks = _ensure_drinks(bars)
        _ensure_sessions(bars)
        _ensure_price_points(drinks)
        _ensure_trades(drinks)
        self.stdout.write(self.style.SUCCESS(_("Development fixtures are available.")))
