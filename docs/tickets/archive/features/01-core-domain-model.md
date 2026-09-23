You are working in a Django project (Python 3.12+). Implement the core domain model for the drink market.

Goal:

- Models for Bar, Drink, MarketSession, Trade, PricePoint, EventDefinition, ActiveEvent
- Solid field types, indexes, constraints
- Minimally usable admin configuration
- Unit tests for model validation & defaults

Constraints:

- Postgres as the DB, Redis will be used later
- Multi-bar: all relevant objects hang off Bar (FK)
- Drink: base_price, current_price, min_price, max_price, volatility, weight
- Trade: qty (int >0), occurred_at
- PricePoint: recorded_at, price
- EventDefinition: type (choices), probability_weight, duration_seconds, params JSON
- ActiveEvent: starts_at, ends_at, state JSON

Approach:

1) Create Django app(s) `bars`, `market`, `events` (or combine sensibly) incl. migrations.
2) Add clean `__str__`, Meta ordering, indexes (bar_id + recorded_at; bar_id + occurred_at).
3) Write tests (pytest or Django TestCase; if the repo has nothing yet: Django TestCase).
4) Document assumptions briefly in `docs/architecture.md` if necessary (only if you need to close gaps).

Deliverables:

- Code + migrations + tests
- Short PR-ready commit (do not create a PR), clear commit message
