import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from bars.models import Bar
from events.models import ActiveEvent
from market.models import Drink, Trade
from market.serializers import build_price_update_payload
from market.services.broadcast import broadcast_prices
from market.services.price_math import finalize_price

logger = logging.getLogger(__name__)


def calculate_trade_prices(target: Drink, drinks: list[Drink], qty: int, bar: Bar) -> dict[int, Decimal]:
    """Return the new price for every drink in the bar after `qty` units of `target` were bought.

    impulse = qty * volatility * impulse_factor * base_price. The purchased drink rises by the impulse, every other
    drink falls by `impulse * normalization_factor * (weight / sum of the other weights)`. All prices are rounded to
    their step and clamped to their bounds.
    """

    def current(drink: Drink) -> Decimal:
        return drink.current_price if drink.current_price else drink.base_price

    impulse = Decimal(qty) * target.volatility * bar.impulse_factor * target.base_price
    prices = {target.pk: finalize_price(current(target) + impulse, target)}

    others = [drink for drink in drinks if drink.pk != target.pk]
    total_weight = sum((drink.weight for drink in others), Decimal("0"))
    offset = impulse * bar.normalization_factor
    for drink in others:
        share = drink.weight / total_weight if total_weight > 0 else Decimal("0")
        prices[drink.pk] = finalize_price(current(drink) - offset * share, drink)
    return prices


def apply_trade(bar: Bar, drink: Drink, qty: int) -> tuple[Trade, list[Drink]]:
    """Record a trade, move the bar's prices accordingly and broadcast the new prices.

    Drink rows are locked in primary-key order, the same order the market tick uses, so trades and ticks serialize
    instead of overwriting each other or deadlocking.
    """

    if qty < 1:
        raise ValueError("qty must be at least 1")
    with transaction.atomic():
        drinks = list(Drink.objects.select_for_update().filter(bar=bar).order_by("pk"))
        target = next((entry for entry in drinks if entry.pk == drink.pk), None)
        if target is None:
            raise Drink.DoesNotExist("Drink does not belong to this bar.")
        price_before = target.current_price if target.current_price else target.base_price
        new_prices = calculate_trade_prices(target, drinks, qty, bar)
        now = timezone.now()
        for entry in drinks:
            entry.current_price = new_prices[entry.pk]
            entry.history_override = [{"timestamp": now.isoformat(), "price": str(entry.current_price)}]
        Drink.objects.bulk_update(drinks, ["current_price"])
        trade = Trade.objects.create(bar=bar, drink=target, price=price_before, qty=qty, occurred_at=now)
        transaction.on_commit(lambda: _broadcast(bar, drinks, now))
    return trade, drinks


def _broadcast(bar: Bar, drinks: list[Drink], now) -> None:
    """Push the post-trade prices immediately instead of waiting for the next tick."""
    try:
        events = ActiveEvent.objects.filter(bar=bar, is_active=True).select_related("definition").order_by("starts_at")
        broadcast_prices(bar.slug, build_price_update_payload(bar.slug, drinks, events, timestamp=now.isoformat()))
    except Exception:
        logger.exception("Failed to broadcast prices after a trade for bar %s", bar.slug)
