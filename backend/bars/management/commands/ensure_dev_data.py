import os
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.bar_assignment import BarAssignment
from bars.models import Bar
from events.models import EventDefinition
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
    {
        "slug": "cologne-domstadt",
        "name": "Domstadt Kölsch House",
        "description": "Traditional Cologne pub pouring fresh Kölsch alongside crisp mineral water and soft drinks.",
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
    {
        "bar_slug": "cologne-domstadt",
        "name": "Gaffel Kölsch",
        "base_price": Decimal("3.90"),
        "current_price": Decimal("3.95"),
        "min_price": Decimal("3.20"),
        "max_price": Decimal("4.40"),
        "volatility": Decimal("0.05"),
        "weight": Decimal("0.90"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Reissdorf Kölsch",
        "base_price": Decimal("4.10"),
        "current_price": Decimal("4.00"),
        "min_price": Decimal("3.50"),
        "max_price": Decimal("4.80"),
        "volatility": Decimal("0.07"),
        "weight": Decimal("0.85"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Sparkling Mineral Water",
        "base_price": Decimal("2.80"),
        "current_price": Decimal("2.80"),
        "min_price": Decimal("2.30"),
        "max_price": Decimal("3.10"),
        "volatility": Decimal("0.03"),
        "weight": Decimal("0.65"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Citrus Lemonade Spritz",
        "base_price": Decimal("3.20"),
        "current_price": Decimal("3.35"),
        "min_price": Decimal("2.80"),
        "max_price": Decimal("3.90"),
        "volatility": Decimal("0.04"),
        "weight": Decimal("0.70"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Cologne Cola",
        "base_price": Decimal("3.30"),
        "current_price": Decimal("3.25"),
        "min_price": Decimal("2.90"),
        "max_price": Decimal("3.60"),
        "volatility": Decimal("0.04"),
        "weight": Decimal("0.60"),
    },
    {
        "bar_slug": "riverfront",
        "name": "Riverfront IPA",
        "base_price": Decimal("6.80"),
        "current_price": Decimal("6.85"),
        "min_price": Decimal("6.00"),
        "max_price": Decimal("8.60"),
        "volatility": Decimal("0.11"),
        "weight": Decimal("0.95"),
    },
    {
        "bar_slug": "riverfront",
        "name": "Woodland Amber",
        "base_price": Decimal("6.20"),
        "current_price": Decimal("6.10"),
        "min_price": Decimal("5.40"),
        "max_price": Decimal("7.50"),
        "volatility": Decimal("0.09"),
        "weight": Decimal("0.90"),
    },
    {
        "bar_slug": "north-harbor",
        "name": "North Harbor Amber",
        "base_price": Decimal("7.50"),
        "current_price": Decimal("7.40"),
        "min_price": Decimal("6.60"),
        "max_price": Decimal("9.00"),
        "volatility": Decimal("0.10"),
        "weight": Decimal("1.05"),
    },
    {
        "bar_slug": "north-harbor",
        "name": "Harbor Pale Ale",
        "base_price": Decimal("6.90"),
        "current_price": Decimal("6.95"),
        "min_price": Decimal("6.20"),
        "max_price": Decimal("8.30"),
        "volatility": Decimal("0.08"),
        "weight": Decimal("0.95"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Domstadter Radler",
        "base_price": Decimal("3.80"),
        "current_price": Decimal("3.85"),
        "min_price": Decimal("3.20"),
        "max_price": Decimal("4.50"),
        "volatility": Decimal("0.05"),
        "weight": Decimal("0.80"),
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": "Herbal Lemonade",
        "base_price": Decimal("3.60"),
        "current_price": Decimal("3.55"),
        "min_price": Decimal("3.10"),
        "max_price": Decimal("4.20"),
        "volatility": Decimal("0.04"),
        "weight": Decimal("0.70"),
    },
]

DEV_PRICE_POINTS = [
    {"bar_slug": "riverfront", "drink_name": "Riverfront Lager", "price": Decimal("5.75")},
    {"bar_slug": "riverfront", "drink_name": "Citrus Saison", "price": Decimal("7.20")},
    {"bar_slug": "north-harbor", "drink_name": "Harbor Stout", "price": Decimal("8.30")},
    {"bar_slug": "cologne-domstadt", "drink_name": "Gaffel Kölsch", "price": Decimal("3.95")},
    {"bar_slug": "cologne-domstadt", "drink_name": "Sparkling Mineral Water", "price": Decimal("2.80")},
    {"bar_slug": "cologne-domstadt", "drink_name": "Citrus Lemonade Spritz", "price": Decimal("3.35")},
    {"bar_slug": "riverfront", "drink_name": "Riverfront IPA", "price": Decimal("6.85")},
    {"bar_slug": "riverfront", "drink_name": "Woodland Amber", "price": Decimal("6.10")},
    {"bar_slug": "north-harbor", "drink_name": "North Harbor Amber", "price": Decimal("7.40")},
    {"bar_slug": "north-harbor", "drink_name": "Harbor Pale Ale", "price": Decimal("6.95")},
    {"bar_slug": "cologne-domstadt", "drink_name": "Domstadter Radler", "price": Decimal("3.85")},
    {"bar_slug": "cologne-domstadt", "drink_name": "Herbal Lemonade", "price": Decimal("3.55")},
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
    {
        "bar_slug": "cologne-domstadt",
        "drink_name": "Gaffel Kölsch",
        "price": Decimal("3.95"),
        "qty": 6,
    },
    {
        "bar_slug": "cologne-domstadt",
        "drink_name": "Citrus Lemonade Spritz",
        "price": Decimal("3.35"),
        "qty": 2,
    },
    {
        "bar_slug": "riverfront",
        "drink_name": "Riverfront IPA",
        "price": Decimal("6.85"),
        "qty": 3,
    },
    {
        "bar_slug": "riverfront",
        "drink_name": "Woodland Amber",
        "price": Decimal("6.10"),
        "qty": 1,
    },
    {
        "bar_slug": "north-harbor",
        "drink_name": "North Harbor Amber",
        "price": Decimal("7.40"),
        "qty": 2,
    },
    {
        "bar_slug": "north-harbor",
        "drink_name": "Harbor Pale Ale",
        "price": Decimal("6.95"),
        "qty": 4,
    },
    {
        "bar_slug": "cologne-domstadt",
        "drink_name": "Domstadter Radler",
        "price": Decimal("3.85"),
        "qty": 3,
    },
    {
        "bar_slug": "cologne-domstadt",
        "drink_name": "Herbal Lemonade",
        "price": Decimal("3.55"),
        "qty": 2,
    },
]

DEV_EVENT_DEFINITIONS = [
    {
        "bar_slug": "riverfront",
        "name": _("Rush Hour Surge"),
        "description": _("Bright lagers and saisons keep pouring as the crowd floods in."),
        "type": EventDefinition.EventType.BOOM,
        "probability_weight": Decimal("1.40"),
        "duration_seconds": 75,
        "cooldown_seconds": 120,
        "params": {"start_multiplier": 1.25},
    },
    {
        "bar_slug": "riverfront",
        "name": _("Citrus Focus Shift"),
        "description": _("The citrus-forward lineup becomes the one to chase for a limited time."),
        "type": EventDefinition.EventType.FOCUS,
        "probability_weight": Decimal("0.90"),
        "duration_seconds": 60,
        "cooldown_seconds": 120,
        "params": {"start_multiplier": 1.4},
        "target_drink_names": ["Citrus Saison", "Riverfront IPA"],
    },
    {
        "bar_slug": "north-harbor",
        "name": _("Harbor Deep Crash"),
        "description": _("A chill settling in makes prices slide as more sips to try."),
        "type": EventDefinition.EventType.CRASH,
        "probability_weight": Decimal("1.05"),
        "duration_seconds": 90,
        "cooldown_seconds": 150,
        "params": {"start_multiplier": 0.75},
    },
    {
        "bar_slug": "north-harbor",
        "name": _("Rye Focus Blast"),
        "description": _("North Harbor’s rye and amber pours steal the spotlight."),
        "type": EventDefinition.EventType.FOCUS,
        "probability_weight": Decimal("0.95"),
        "duration_seconds": 65,
        "cooldown_seconds": 120,
        "params": {"start_multiplier": 1.3},
        "target_drink_names": ["North Harbor Amber", "Harbor Pale Ale"],
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": _("Domstadt Reset"),
        "description": _("Prices gently drift back toward base as the rush eases."),
        "type": EventDefinition.EventType.NORMALIZE,
        "probability_weight": Decimal("1.25"),
        "duration_seconds": 45,
        "cooldown_seconds": 90,
        "params": {},
    },
    {
        "bar_slug": "cologne-domstadt",
        "name": _("Radler Warm-Up"),
        "description": _("Refreshment builds around spritzers and Radlers."),
        "type": EventDefinition.EventType.BOOM,
        "probability_weight": Decimal("0.85"),
        "duration_seconds": 55,
        "cooldown_seconds": 120,
        "params": {"start_multiplier": 1.2},
    },
]


def _ensure_superuser():
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

    return user


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


def _ensure_event_definitions(bars: dict[str, Bar], drinks: dict[tuple[str, str], Drink]) -> None:
    for entry in DEV_EVENT_DEFINITIONS:
        bar = bars[entry["bar_slug"]]
        params = dict(entry.get("params", {}))
        target_names = entry.get("target_drink_names")
        if target_names:
            ids = [drinks[(bar.slug, drink_name)].id for drink_name in target_names if (bar.slug, drink_name) in drinks]
            if ids:
                params["target_drink_ids"] = ids
        EventDefinition.objects.update_or_create(
            bar=bar,
            name=entry["name"],
            defaults={
                "description": entry.get("description", ""),
                "type": entry["type"],
                "probability_weight": entry["probability_weight"],
                "duration_seconds": entry["duration_seconds"],
                "cooldown_seconds": entry.get("cooldown_seconds"),
                "params": params,
            },
        )


def _ensure_bar_assignments(user, bars: dict[str, Bar]) -> None:
    for bar in bars.values():
        BarAssignment.objects.get_or_create(user=user, bar=bar)


class Command(BaseCommand):
    """Ensures default development fixtures exist so the project is immediately usable."""

    help = _("Populates development fixtures (superuser, bars, drinks, price points, trades).")

    def handle(self, *args, **options) -> None:
        user = _ensure_superuser()
        bars = _ensure_bars()
        _ensure_bar_assignments(user, bars)
        drinks = _ensure_drinks(bars)
        _ensure_sessions(bars)
        _ensure_price_points(drinks)
        _ensure_trades(drinks)
        _ensure_event_definitions(bars, drinks)
        self.stdout.write(self.style.SUCCESS(_("Development fixtures are available.")))
