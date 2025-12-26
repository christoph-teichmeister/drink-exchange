Implementiere das konfigurierbare Event-System inkl. Random Rolls und Eventwirkung.

Ziel:

- Admin kann EventDefinitions pflegen (type, probability_weight, duration_seconds, params)
- Celery Beat rollt alle Y Sekunden pro Bar, ob ein Event startet
- ActiveEvent wird erzeugt, endet automatisch
- Event beeinflusst Preise (Multipliers) in der Preisengine (siehe ADR 0001)

Event Types (MVP):

- BOOM (multiplier > 1.0 global)
- CRASH (multiplier < 1.0 global)
- FOCUS (multiplier nur für target_drink_ids)

Vorgaben:

- Wahrscheinlichkeit proportional zu probability_weight
- Cooldown optional (wenn nicht vorhanden: simple „max 1 active event“ pro Bar)
- Event-Multiplier kann linear abklingen von start_multiplier zu 1.0 über duration

Aufgaben:

1) Domain: EventDefinition, ActiveEvent (falls nicht existiert), plus Service layer:
    - select_event(bar_id)
    - start_event(bar_id, event_def)
    - end_expired_events(bar_id)
2) Celery tasks:
    - event_roll_all_bars
    - event_roll(bar_id)
    - cleanup_expired_events
3) Integration Preisengine:
    - `get_effective_multiplier(bar_id, drink_id, now)` aggregiert active events
4) WebSocket broadcasts:
    - event.started / event.ended an market.<bar_id>
5) Tests:
    - weight selection deterministisch via seed
    - start/end behavior
    - multiplier decay function

Deliverables:

- Services + tasks + integration + tests
- Update ADR/Docs nur wenn du abweichst; sonst nur referenzieren
