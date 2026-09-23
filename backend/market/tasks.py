import logging
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

import redis
from celery import shared_task
from django.conf import settings
from django.db import connections, transaction
from django.db.models import Prefetch
from django.utils import timezone
from redis.lock import Lock as RedisLock

from bars.models import Bar
from events.models import ActiveEvent
from events.services import compute_event_multiplier
from market.models import Drink, PricePoint
from market.serializers import HISTORY_LIMIT, build_price_update_payload
from market.services import broadcast_prices

logger = logging.getLogger(__name__)

PRICE_QUANTUM = Decimal("0.01")
REDIS_LOCK_TIMEOUT = 10
_LOCAL_LOCKS: dict[int, threading.Lock] = {}


def _round_to_step(value: Decimal, step: Decimal) -> Decimal:
    """Snap a price value to the configured rounding step with half-up rounding."""
    if not step or step <= 0:
        return value
    ratio = (value / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return (ratio * step).quantize(PRICE_QUANTUM)


def _clamp_price(value: Decimal, minimum: Decimal, maximum: Decimal) -> Decimal:
    """Ensure calculated prices always stay within the bar's min/max bounds."""
    return max(minimum, min(value, maximum))


def _calculate_next_price(drink: Drink, reversion_rate: Decimal, multiplier: float = 1.0) -> Decimal:
    """Apply the bar's reversion curve to derive the next tick price for a drink.

    Active market events shift the reversion target from the base price to `base_price * multiplier`,
    so a boom pulls prices up and a crash pulls them down while the event lasts.
    """

    current = drink.current_price or drink.base_price
    target = drink.base_price * Decimal(str(multiplier))
    # Moves the price partway towards the (event-adjusted) target based on reversion_rate.
    delta = (target - current) * reversion_rate
    next_price = _round_to_step(current + delta, drink.rounding_step)
    # Clamp after rounding: rounding can otherwise push a price below min_price or above max_price
    # and violate the drink's bounds check constraint.
    next_price = _clamp_price(next_price, drink.min_price, drink.max_price)
    return next_price.quantize(PRICE_QUANTUM)


def _is_tick_due(bar: Bar, now: datetime) -> bool:
    """Decide whether enough time has passed since the last tick to update prices."""
    if bar.tick_interval_seconds <= 0:
        return False
    last_tick = bar.last_tick_at
    if last_tick is None:
        return True
    return (now - last_tick).total_seconds() >= bar.tick_interval_seconds


def _try_redis_lock(bar_id: int) -> RedisLock | None:
    """Try to obtain a distributed Redis lock so ticks don't overlap across workers."""
    redis_url = getattr(settings, "REDIS_URL", None)
    if not redis_url:
        return None
    client = redis.Redis.from_url(redis_url, decode_responses=True)
    lock = client.lock(f"market:bar-lock:{bar_id}", timeout=REDIS_LOCK_TIMEOUT)
    try:
        if lock.acquire(blocking=False):
            return lock
        raise RuntimeError("bar lock busy")
    except redis.exceptions.RedisError as exc:
        logger.debug("Redis lock unavailable: %s", exc)
    return None


def _broadcast_snapshot(bar: Bar, drinks: list[Drink], now: datetime) -> None:
    """Send the latest tick snapshot to every websocket listening for the bar."""
    events = bar.active_events.filter(is_active=True).select_related("definition").order_by("starts_at")
    payload = build_price_update_payload(bar.slug, drinks, events, timestamp=now.isoformat())
    broadcast_prices(bar.slug, payload)


@contextmanager
def bar_lock(bar_id: int):
    """Provide a multi-strategy lock to prevent concurrent ticks for the same bar."""
    bar_id_int = int(bar_id)
    redis_lock = _try_redis_lock(bar_id_int)
    if redis_lock is not None:
        try:
            yield
        finally:
            try:
                redis_lock.release()
            except redis.exceptions.RedisError:
                logger.debug("Failed to release Redis lock for bar %s", bar_id_int)
        return
    connection = connections["default"]
    if connection.vendor == "postgresql":
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT pg_try_advisory_lock(%s)", (bar_id_int,))
            if not cursor.fetchone()[0]:
                raise RuntimeError("bar lock busy")
            try:
                yield
            finally:
                cursor.execute("SELECT pg_advisory_unlock(%s)", (bar_id_int,))
        finally:
            cursor.close()
        return
    lock = _LOCAL_LOCKS.setdefault(bar_id_int, threading.Lock())
    if not lock.acquire(blocking=False):
        raise RuntimeError("bar lock busy")
    try:
        yield
    finally:
        lock.release()


def _execute_tick(bar: Bar) -> bool:
    """Run a single market tick that recalculates drink prices and optionally records them."""
    now = timezone.now()
    bar.refresh_from_db()
    if not _is_tick_due(bar, now):
        return False
    # Only the newest points are ever serialized, so never load a drink's full price history.
    price_points_prefetch = Prefetch(
        "price_points",
        queryset=PricePoint.objects.order_by("-recorded_at")[:HISTORY_LIMIT],
        to_attr="recent_points",
    )
    active_events = list(
        ActiveEvent.objects.filter(bar=bar, is_active=True, starts_at__lte=now, ends_at__gt=now).select_related(
            "definition"
        )
    )
    interval_seconds = bar.tick_interval_seconds or 0
    tick_interval_seconds = interval_seconds if interval_seconds > 0 else 1
    previous_timestamp = (now - timedelta(seconds=tick_interval_seconds)).isoformat()
    tick_counter = (bar.tick_counter or 0) + 1
    should_record = bar.price_point_retention_ticks > 0 and tick_counter % bar.price_point_retention_ticks == 0
    with transaction.atomic():
        # Lock the drink rows so concurrent writes (e.g. an admin edit) are not silently overwritten.
        drinks = list(bar.drinks.select_for_update().order_by("pk").prefetch_related(price_points_prefetch))
        for drink in drinks:
            if not hasattr(drink, "recent_points"):
                drink.recent_points = []
            old_price = drink.current_price if drink.current_price is not None else drink.base_price
            multiplier = 1.0
            for active_event in active_events:
                multiplier *= compute_event_multiplier(active_event, drink.id, now=now)
            next_price = _calculate_next_price(drink, bar.reversion_rate, multiplier)
            drink.history_override = [
                {"timestamp": previous_timestamp, "price": str(old_price)},
                {"timestamp": now.isoformat(), "price": str(next_price)},
            ]
            drink.current_price = next_price
        if drinks:
            Drink.objects.bulk_update(drinks, ["current_price"])
        bar.last_tick_at = now
        bar.tick_counter = tick_counter
        bar.save(update_fields=["last_tick_at", "tick_counter"])
        if should_record and drinks:
            drink_map = {drink.id: drink for drink in drinks}
            recorded_points = PricePoint.objects.bulk_create(
                [
                    PricePoint(
                        bar=bar,
                        drink=drink,
                        price=drink.current_price,
                        recorded_at=now,
                    )
                    for drink in drinks
                ]
            )
            for point in recorded_points:
                drink_obj = drink_map.get(point.drink_id)
                if drink_obj:
                    drink_obj.recent_points.insert(0, point)
    try:
        _broadcast_snapshot(bar, drinks, now=now)
    except Exception:
        logger.exception("Failed to broadcast market snapshot for bar %s", bar.slug)
    logger.debug(
        "Market tick applied to bar %s (recorded price points=%s)",
        bar.pk,
        should_record,
    )
    return True


@shared_task
def market_tick(bar_id: int) -> bool:
    """Task that runs a single tick for the specified bar, honoring locking."""
    bar = Bar.objects.filter(pk=bar_id).first()
    if not bar:
        logger.debug("Bar %s not found for market tick", bar_id)
        return False
    try:
        with bar_lock(bar.pk):
            return _execute_tick(bar)
    except RuntimeError as exc:
        logger.debug("Skipping market tick for bar %s: %s", bar_id, exc)
        return False


@shared_task
def market_tick_all_bars() -> None:
    """Enqueue ticks for every eligible bar without duplicating timing logic."""
    now = timezone.now()
    for bar in Bar.objects.all():
        if not _is_tick_due(bar, now):
            continue
        # Fan out one task per bar so a slow bar never delays the others.
        market_tick.delay(bar.pk)
