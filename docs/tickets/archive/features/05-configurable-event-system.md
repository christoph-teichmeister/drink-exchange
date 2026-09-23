Implement the configurable event system incl. random rolls and event impact.

Goal:

- Admin can maintain EventDefinitions (type, probability_weight, duration_seconds, params)
- Celery Beat rolls every Y seconds per bar whether an event starts
- ActiveEvent is persisted, ends automatically
- Event influences prices (multipliers) in the pricing engine (see ADR 0001)

Event types (MVP):

- BOOM (multiplier > 1.0 global)
- CRASH (multiplier < 1.0 global)
- FOCUS (multiplier only for target_drink_ids)

Constraints:

- Probability proportional to probability_weight
- Cooldown optional (if not present: simple "max 1 active event" per bar)
- Event multiplier can decay linearly from start_multiplier to 1.0 over duration

Tasks:

1) Domain: EventDefinition, ActiveEvent (if not existing), plus service layer:
    - select_event(bar_id)
    - start_event(bar_id, event_def)
    - end_expired_events(bar_id)
2) Celery tasks:
    - event_roll_all_bars
    - event_roll(bar_id)
    - cleanup_expired_events
3) Pricing engine integration:
    - `get_effective_multiplier(bar_id, drink_id, now)` aggregates active events
4) WebSocket broadcasts:
    - event.started / event.ended to market.<bar_id>
5) Tests:
    - weight selection deterministic via seed
    - start/end behavior
    - multiplier decay function

Deliverables:

- Services + tasks + integration + tests
- Update ADR/docs only if you deviate; otherwise just reference them
