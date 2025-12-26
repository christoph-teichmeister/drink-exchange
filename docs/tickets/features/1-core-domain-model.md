Du arbeitest in einem Django-Projekt (Python 3.12+). Implementiere das Core Domain Model für den Getränkemarkt.

Ziel:

- Modelle für Bar, Drink, MarketSession, Trade, PricePoint, EventDefinition, ActiveEvent
- Solide Feldtypen, Indizes, Constraints
- Admin-Konfiguration minimal brauchbar
- Unit-Tests für Modellvalidierung & Defaults

Vorgaben/Constraints:

- Postgres als DB, Redis wird später genutzt
- Multi-Bar: alle relevanten Objekte hängen an Bar (FK)
- Drink: base_price, current_price, min_price, max_price, volatility, weight
- Trade: qty (int >0), occurred_at
- PricePoint: recorded_at, price
- EventDefinition: type (choices), probability_weight, duration_seconds, params JSON
- ActiveEvent: starts_at, ends_at, state JSON

Arbeitsweise:

1) Erzeuge Django App(s) `bars`, `market`, `events` (oder sinnvoll zusammenfassen) inkl. migrations.
2) Lege saubere `__str__` an, Meta ordering, Indexe (bar_id + recorded_at; bar_id + occurred_at).
3) Schreibe Tests (pytest oder Django TestCase; wenn Repo noch nichts hat: Django TestCase).
4) Dokumentiere Annahmen kurz in `docs/architecture.md` falls nötig (nur wenn du Lücken schließen musst).

Deliverables:

- Code + migrations + tests
- Kurzer PR-ready Commit (kein PR erstellen), klare Commit-Message
