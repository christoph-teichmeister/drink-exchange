from bars.models import Bar
from events.models import EventDefinition
from market.models import Drink


def _number(value):
    return None if value is None else float(value)


def bar_settings_payload(bar: Bar) -> dict:
    return {
        "slug": bar.slug,
        "name": bar.name,
        "description": bar.description,
        "tick_interval_seconds": bar.tick_interval_seconds,
        "reversion_rate": _number(bar.reversion_rate),
        "impulse_factor": _number(bar.impulse_factor),
        "normalization_factor": _number(bar.normalization_factor),
        "price_point_retention_ticks": bar.price_point_retention_ticks,
    }


def drink_config_payload(drink: Drink) -> dict:
    return {
        "id": drink.pk,
        "name": drink.name,
        "base_price": _number(drink.base_price),
        "current_price": _number(drink.current_price),
        "min_price": _number(drink.min_price),
        "max_price": _number(drink.max_price),
        "volatility": _number(drink.volatility),
        "weight": _number(drink.weight),
        "rounding_step": _number(drink.rounding_step),
        "has_trades": drink.trades.exists(),
    }


def event_definition_payload(definition: EventDefinition) -> dict:
    params = definition.params or {}
    return {
        "id": definition.pk,
        "name": definition.name,
        "description": definition.description,
        "type": definition.type,
        "probability_weight": _number(definition.probability_weight),
        "duration_seconds": definition.duration_seconds,
        "cooldown_seconds": definition.cooldown_seconds,
        "params": {
            "start_multiplier": params.get("start_multiplier"),
            "target_drink_ids": params.get("target_drink_ids", []),
        },
    }
