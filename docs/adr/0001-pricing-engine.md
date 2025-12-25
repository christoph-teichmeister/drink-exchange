# ADR 0001: Preisengine & Marktmechanik

## Status

Accepted

## Kontext

Wir simulieren einen Getränkemarkt für eine Bar:

- Käufe beeinflussen Preise sofort (Impuls)
- Ohne Käufe sollen Preise langsam zum Basispreis zurückkehren (Decay/Mean-Reversion)
- „Andere Preise sinken“ als Ausgleich (Normalization), damit der Markt „atmet“
- Random Events können global oder zielgerichtet wirken

Wir benötigen eine Preislogik, die:

- verständlich konfigurierbar ist
- stabil ist (keine Explosion)
- live-fähig ist (häufige Updates)
- deterministisch genug ist, um debugbar zu sein

## Entscheidung

Wir implementieren eine hybride Preisengine aus:

1. **Impuls pro Trade**
2. **Normalization auf andere Drinks**
3. **Mean-Reversion pro Tick**
4. **Event-Multipliers (zeitlich begrenzt)**
5. **Clamping (min/max)**

### 1) Impuls auf gekauftes Getränk

Bei Trade `qty`:

- `impulse = qty * volatility * impulse_factor`
- `price_target += impulse`

`volatility` ist pro Drink konfigurierbar (z. B. 0.02 bis 0.15).

### 2) Normalization (andere sinken)

Um einen einfachen „Markt-Ausgleich“ zu erzeugen:

- Der Gesamtimpuls wird auf andere Drinks verteilt (proportional nach `weight`)
- Für jedes andere Getränk:
    - `price_other -= impulse * normalization_factor * (weight_other / sum_weights_others)`

Das erzeugt das gewünschte Verhalten: Einer steigt, andere sinken etwas.

### 3) Mean-Reversion / Decay pro Tick

Alle X Sekunden:

- `price = price + (base_price - price) * reversion_rate`

`reversion_rate` (z. B. 0.01–0.05 pro Tick) ist bar-weit konfigurierbar.

### 4) Events

Active Events liefern Multipliers:

- Global: alle Drinks
- Focus: nur Ziel-Subset
- Crash/Boom: additiv oder multiplikativ (Konfiguration)

Wir nutzen *multiplikativ* als Default:

- `price *= event_multiplier`

Eventwirkung kann über die Zeit abklingen:

- `event_multiplier(t)` interpoliert von start_multiplier zu 1.0

### 5) Clamping

Nach jeder Berechnung:

- `price = clamp(price, min_price, max_price)`
- optional: auf 0.05/0.10 runden (currency_step)

## Alternativen

- Rein supply/demand mit Orderbook (zu komplex)
- Rein zufällige Preisbewegungen (zu wenig kausal)
- Nur Mean-Reversion ohne Normalization (Markt wirkt „tot“)

## Konsequenzen

Positiv:

- Einfach zu erklären
- Konfigurierbar pro Bar/Drink
- Stabil und testbar
- Live-tauglich

Negativ:

- Normalization ist ein „Game-Mechanic“, kein echter Markt
- Muss sorgfältig geclamped werden, sonst entsteht Drift/Edge Cases

## Teststrategie

- Unit-Tests für:
    - Impulsberechnung
    - Normalization-Summe (Gesamtänderung im Rahmen)
    - Mean-Reversion Konvergenz
    - Event-Multipliers + Ablauf
    - Clamping & rounding

- Property-based Tests (optional):
    - Preis bleibt in [min,max]
    - Reversion führt langfristig Richtung base_price
