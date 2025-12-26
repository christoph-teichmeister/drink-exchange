from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import logging
import threading

import redis
from celery import shared_task
from django.conf import settings
from django.db import connections, transaction
from django.utils import timezone

from bars.models import Bar
from market.models import Drink, PricePoint

logger = logging.getLogger(__name__)

PRICE_QUANTUM = Decimal("0.01")
REDIS_LOCK_TIMEOUT = 10
_LOCAL_LOCKS: dict[int, threading.Lock] = {}


def _round_to_step(value: Decimal, step: Decimal) -> Decimal:
    if not step or step <= 0:
        return value
    ratio = (value / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return (ratio * step).quantize(PRICE_QUANTUM)


def _clamp_price(value: Decimal, minimum: Decimal, maximum: Decimal) -> Decimal:
    return max(minimum, min(value, maximum))


def _calculate_next_price(drink: Drink, reversion_rate: Decimal) -> Decimal:
    current = drink.current_price or drink.base_price
    delta = (drink.base_price - current) * reversion_rate
    next_price = current + delta
    next_price = _clamp_price(next_price, drink.min_price, drink.max_price)
    rounded = _round_to_step(next_price, drink.rounding_step)
    return rounded.quantize(PRICE_QUANTUM)


def _is_tick_due(bar: Bar, now: datetime) -> bool:
    if bar.tick_interval_seconds <= 0:
        return False
    last_tick = bar.last_tick_at
    if last_tick is None:
        return True
    return (now - last_tick).total_seconds() >= bar.tick_interval_seconds


def _try_redis_lock(bar_id: int) -> redis.Lock | None:
    redis_url = getattr(settings, "REDIS_URL", None)
    if not redis_url:
        return None
    client = redis.Redis.from_url(redis_url, decode_responses=True)
    lock = client.lock(f"market:bar-lock:{bar_id}", timeout=REDIS_LOCK_TIMEOUT)
    try:
        if lock.acquire(blocking=False):
            return lock
    except redis.exceptions.RedisError as exc:
        logger.debug("Redis lock unavailable: %s", exc)
    return None


@contextmanager
def bar_lock(bar_id: int):
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
    now = timezone.now()
    bar.refresh_from_db()
    if not _is_tick_due(bar, now):
        return False
    drinks = list(bar.drinks.all())
    updated_prices: list[Drink] = []
    for drink in drinks:
        drink.current_price = _calculate_next_price(drink, bar.reversion_rate)
        updated_prices.append(drink)
    tick_counter = (bar.tick_counter or 0) + 1
    should_record = (
        bar.price_point_retention_ticks > 0
        and tick_counter % bar.price_point_retention_ticks == 0
    )
    with transaction.atomic():
        if updated_prices:
            Drink.objects.bulk_update(updated_prices, ["current_price"])
        bar.last_tick_at = now
        bar.tick_counter = tick_counter
        bar.save(update_fields=["last_tick_at", "tick_counter"])
        if should_record and drinks:
            PricePoint.objects.bulk_create(
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
    logger.debug(
        "Market tick applied to bar %s (recorded price points=%s)",
        bar.pk,
        should_record,
    )
    return True


@shared_task
def market_tick(bar_id: int) -> bool:
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
    now = timezone.now()
    for bar in Bar.objects.all():
        if not _is_tick_due(bar, now):
            continue
        market_tick(bar.pk)
