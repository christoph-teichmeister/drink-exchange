Implementiere die Big Screen View (Trading Floor) als separate Frontend-Route und stelle nötige Endpoints bereit.

Ziel:

- Fullscreen Board: Ticker + Live Chart pro Drink (line chart reicht MVP)
- WebSocket verbindet sich zu /ws/market/<bar_id>/
- Visualisiert price + delta + trend
- Event overlays (banner) bei event.started/event.ended

Constraints:

- Frontend frei wählbar (bevorzugt SvelteKit oder Vue3). Wenn Repo schon Frontend nutzt: bleib dabei.
- Keine Farbvorgaben, aber lesbar und klar.
- Minimaler Build/Dev Setup (Vite)

Backend:

- Wenn REST endpoint für initial snapshot noch nicht existiert, implementiere GET /api/bars/<bar_id>/market/

Aufgaben:

1) Frontend Route: /board/<bar_id>
2) WS Client, reconnect strategy, state store
3) Chart lib: Chart.js oder ECharts (MVP)
4) UI: Top ticker bar + grid of drinks + charts
5) Dokumentiere Start im README (dev commands)

Deliverables:

- Frontend code + minimal backend endpoint falls nötig
- Kurze README Ergänzung: wie Board starten und öffnen
