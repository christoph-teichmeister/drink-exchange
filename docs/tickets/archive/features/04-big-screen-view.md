Implement the Big Screen view (trading floor) as a separate frontend route and provide the necessary endpoints.

Goal:

- Fullscreen board: ticker + live chart per drink (line chart is enough for MVP)
- WebSocket connects to /ws/market/<bar_id>/
- Visualizes price + delta + trend
- Event overlays (banner) on event.started/event.ended

Constraints:

- Frontend framework is free to choose (preferably SvelteKit or Vue3). If the repo already uses a frontend, stick
  with it.
- No color requirements, but readable and clear.
- Minimal build/dev setup (Vite)

Backend:

- If a REST endpoint for the initial snapshot does not exist yet, implement GET /api/bars/<bar_id>/market/

Tasks:

1) Frontend route: /board/<bar_id>
2) WS client, reconnect strategy, state store
3) Chart library: Chart.js or ECharts (MVP)
4) UI: top ticker bar + grid of drinks + charts
5) Document how to start it in the README (dev commands)

Deliverables:

- Frontend code + minimal backend endpoint if necessary
- Short README addition: how to start and open the board
