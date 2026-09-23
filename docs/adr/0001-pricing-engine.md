# ADR 0001: Pricing Engine & Market Mechanics

## Status

Accepted

## Context

We simulate a drink market for a bar:

- Purchases influence prices immediately (impulse)
- Without purchases, prices should slowly return to the base price (decay/mean-reversion)
- "Other prices drop" as an offset (normalization), so the market "breathes"
- Random events can act globally or in a targeted way

We need a pricing logic that:

- is understandably configurable
- is stable (no explosion)
- is live-capable (frequent updates)
- is deterministic enough to be debuggable

## Decision

We implement a hybrid pricing engine consisting of:

1. **Impulse per trade**
2. **Normalization on other drinks**
3. **Mean-reversion per tick**
4. **Event multipliers (time-limited)**
5. **Clamping (min/max)**

### 1) Impulse on the purchased drink

For a trade of `qty`:

- `impulse = qty * volatility * impulse_factor * base_price`
- `price += impulse`

`volatility` is configurable per drink (e.g. 0.02 to 0.15) and is a fraction of the drink's `base_price`, so impulses
scale with the price level. `impulse_factor` is configurable per bar (default 1.0).

Implementation note: `market/services/trading.py` (`apply_trade`); the price is moved directly rather than via a
separate target. Mean-reversion (step 3) then pulls it back on subsequent ticks.

### 2) Normalization (others drop)

To produce a simple "market offset":

- The total impulse is distributed across the other drinks (proportional to `weight`); `normalization_factor` is
  configurable per bar (0–1, default 0.5)
- For each other drink:
    - `price_other -= impulse * normalization_factor * (weight_other / sum_weights_others)`

This produces the desired behavior: one goes up, others drop slightly.

### 3) Mean-reversion / decay per tick

Every X seconds:

- `price = price + (base_price - price) * reversion_rate`

`reversion_rate` (e.g. 0.01–0.05 per tick) is configurable bar-wide.

### 4) Events

Active events provide multipliers:

- Global: all drinks
- Focus: only a target subset
- Crash/boom: additive or multiplicative (configuration)

We use *multiplicative* as the default:

- `price *= event_multiplier`

Event impact can decay over time:

- `event_multiplier(t)` interpolates from start_multiplier to 1.0

### 5) Clamping

After each calculation:

- `price = clamp(price, min_price, max_price)`
- optional: round to 0.05/0.10 (currency_step)

## Alternatives

- Pure supply/demand with an order book (too complex)
- Purely random price movements (too little causality)
- Mean-reversion only, without normalization (market feels "dead")

## Consequences

Positive:

- Easy to explain
- Configurable per bar/drink
- Stable and testable
- Live-capable

Negative:

- Normalization is a "game mechanic", not a real market
- Must be clamped carefully, otherwise drift/edge cases occur

## Test strategy

- Unit tests for:
    - Impulse calculation
    - Normalization sum (total change stays within bounds)
    - Mean-reversion convergence
    - Event multipliers + expiry
    - Clamping & rounding

- Property-based tests (optional):
    - Price stays within [min,max]
    - Reversion moves the price toward base_price in the long run
