from decimal import ROUND_HALF_UP, Decimal

PRICE_QUANTUM = Decimal("0.01")


def round_to_step(value: Decimal, step: Decimal | None) -> Decimal:
    """Snap a price value to the configured rounding step with half-up rounding."""
    if not step or step <= 0:
        return value
    ratio = (value / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return (ratio * step).quantize(PRICE_QUANTUM)


def clamp_price(value: Decimal, minimum: Decimal, maximum: Decimal) -> Decimal:
    """Ensure calculated prices always stay within the drink's min/max bounds."""
    return max(minimum, min(value, maximum))


def finalize_price(value: Decimal, drink) -> Decimal:
    """Round to the drink's step, then clamp to its bounds.

    Clamping comes last: rounding can otherwise push a price below min_price or above max_price and violate the
    drink's bounds check constraint.
    """

    rounded = round_to_step(value, drink.rounding_step)
    return clamp_price(rounded, drink.min_price, drink.max_price).quantize(PRICE_QUANTUM)
