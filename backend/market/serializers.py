from decimal import Decimal
from typing import Iterable, Mapping, Optional

from django.utils import timezone


def _serialize_price_row(drink) -> dict:
    current_price = getattr(drink, "current_price", None)
    price_value = current_price if current_price is not None else drink.base_price
    return {
        "drink_id": drink.id,
        "drink_name": drink.name,
        "price": str(price_value),
        "base_price": str(drink.base_price),
        "delta": str(Decimal(price_value) - drink.base_price),
        "trend": "flat",
    }


def _serialize_event(entry) -> dict:
    return {
        "event_id": entry.id,
        "definition_id": entry.definition_id,
        "definition_name": entry.definition.name,
        "starts_at": entry.starts_at.isoformat(),
        "ends_at": entry.ends_at.isoformat(),
        "is_active": entry.is_active,
    }


def _now_iso() -> str:
    return timezone.now().isoformat()


def build_price_update_payload(
    bar_id: str,
    drinks: Iterable,
    events: Iterable,
    timestamp: Optional[str] = None,
) -> Mapping[str, object]:
    return {
        "type": "prices.update",
        "bar_id": bar_id,
        "timestamp": timestamp or _now_iso(),
        "payload": {
            "prices": [_serialize_price_row(drink) for drink in drinks],
            "active_events": [_serialize_event(event) for event in events],
        },
    }


def build_event_payload(
    bar_id: str,
    event,
    event_type: str,
    timestamp: Optional[str] = None,
    extra: Optional[Mapping[str, object]] = None,
) -> Mapping[str, object]:
    payload = _serialize_event(event)
    if extra:
        payload.update(extra)
    return {
        "type": event_type,
        "bar_id": bar_id,
        "timestamp": timestamp or _now_iso(),
        "payload": payload,
    }


def build_market_status_payload(
    bar_id: str,
    status: str,
    metadata: Optional[Mapping[str, object]] = None,
    timestamp: Optional[str] = None,
) -> Mapping[str, object]:
    return {
        "type": "market.status",
        "bar_id": bar_id,
        "timestamp": timestamp or _now_iso(),
        "payload": {
            "status": status,
            "metadata": metadata or {},
        },
    }
