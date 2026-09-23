import { writable } from 'svelte/store'
import {
  initialConnectionState,
  type ActiveEventPayload,
  type ConnectionState,
  type MarketPayloads,
  type PriceHistoryPayload,
  type PriceRowPayload,
  type TrendValue
} from '$lib/utils/ws-client'

export type { TrendValue }

export type DrinkHistoryPoint = {
  timestamp: string
  price: number
}

export type DrinkSnapshot = {
  id: string
  name: string
  price: number
  // Reference price the market reverts to; null when the backend did not send it.
  base_price?: number | null
  delta: number
  trend: TrendValue
  history: DrinkHistoryPoint[]
}

export type EventType = 'boom' | 'crash' | 'focus' | 'normalize'

// Shapes of the REST snapshot (backend/bars/views.py `bar_market_snapshot`).
export type EventSnapshot = {
  title: string
  description: string
  event_type?: string
  status: 'running' | 'ended' | 'scheduled'
  starts_at?: string
  ends_at?: string
}

export type BoardSnapshot = {
  bar: {
    id: number
    slug: string
    name: string
  }
  drinks: DrinkSnapshot[]
  events?: EventSnapshot[]
  updated_at?: string
}

export type BoardEventStatus = 'running' | 'ended'

export type BoardEvent = {
  id: string
  // Null when the backend sent no name; the UI renders a translated fallback.
  title: string | null
  description: string
  type: EventType | null
  status: BoardEventStatus
  timestamp: string
  startsAt: string | null
  endsAt: string | null
}

export type BoardState = {
  bar: BoardSnapshot['bar'] | null
  drinks: DrinkSnapshot[]
  connection: ConnectionState
  activeEvent: BoardEvent | null
  eventFeed: BoardEvent[]
  // ISO timestamp of the last real price data (snapshot or live frame).
  lastUpdated: string | null
}

export const MAX_HISTORY_POINTS = 24
export const EVENT_FEED_LIMIT = 4
export const ENDED_EVENT_DISPLAY_MS = 8000

const getTrendFromDelta = (delta: number): TrendValue => {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const normalizeHistory = (
  rows: PriceHistoryPayload[] | DrinkHistoryPoint[] | undefined
): DrinkHistoryPoint[] =>
  (rows ?? []).flatMap((row) => {
    const price = toNumber(row.price)
    return row.timestamp && price !== null
      ? [{ timestamp: row.timestamp, price }]
      : []
  })

const timestampValue = (value: string) => {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

// Merges two histories, de-duplicating by timestamp (newer data wins), sorted
// chronologically and clamped to the display window.
export const mergeHistory = (
  existing: DrinkHistoryPoint[],
  incoming: DrinkHistoryPoint[]
): DrinkHistoryPoint[] => {
  const byTimestamp = new Map<string, DrinkHistoryPoint>()
  for (const point of [...existing, ...incoming]) {
    byTimestamp.set(point.timestamp, point)
  }
  return [...byTimestamp.values()]
    .sort((a, b) => timestampValue(a.timestamp) - timestampValue(b.timestamp))
    .slice(-MAX_HISTORY_POINTS)
}

const normalizeSnapshotDrink = (
  drink: DrinkSnapshot,
  fallbackTimestamp: string
): DrinkSnapshot => {
  const price = toNumber(drink.price) ?? 0
  const history = mergeHistory([], normalizeHistory(drink.history))
  return {
    ...drink,
    id: String(drink.id),
    name: drink.name || String(drink.id),
    price,
    base_price: toNumber(drink.base_price),
    delta: toNumber(drink.delta) ?? 0,
    history: history.length
      ? history
      : [{ timestamp: fallbackTimestamp, price }]
  }
}

const normalizePriceRow = (row: PriceRowPayload): DrinkSnapshot | null => {
  const price = toNumber(row.price)
  const id =
    row.drink_id !== undefined && row.drink_id !== null
      ? String(row.drink_id)
      : row.drink_name
  if (!id || price === null) {
    return null
  }
  const delta = toNumber(row.delta) ?? 0
  // The backend currently always reports "flat"; derive it from the delta
  // unless an explicit direction is provided.
  const trend =
    row.trend && row.trend !== 'flat' ? row.trend : getTrendFromDelta(delta)
  return {
    id,
    name: row.drink_name || id,
    price,
    base_price: toNumber(row.base_price),
    delta,
    trend,
    history: normalizeHistory(row.history)
  }
}

const EVENT_TYPES: readonly EventType[] = [
  'boom',
  'crash',
  'focus',
  'normalize'
]

const toEventType = (value: unknown): EventType | null =>
  typeof value === 'string' &&
  (EVENT_TYPES as readonly string[]).includes(value)
    ? (value as EventType)
    : null

const eventKey = (title: string | null, startsAt: string | undefined) =>
  `${title ?? ''}:${startsAt ?? ''}`

const mapSnapshotEvent = (event: EventSnapshot): BoardEvent => ({
  id: eventKey(event.title || null, event.starts_at),
  title: event.title || null,
  description: event.description ?? '',
  type: toEventType(event.event_type),
  status: event.status === 'ended' ? 'ended' : 'running',
  timestamp: event.starts_at ?? event.ends_at ?? '',
  startsAt: event.starts_at ?? null,
  endsAt: event.ends_at ?? null
})

const mapFrameEvent = (
  payload: ActiveEventPayload,
  status: BoardEventStatus,
  frameTimestamp: string
): BoardEvent => {
  const title =
    typeof payload.definition_name === 'string' && payload.definition_name
      ? payload.definition_name
      : null
  const description =
    typeof payload.description === 'string' ? payload.description : ''
  const timestamp =
    status === 'ended'
      ? (payload.ends_at ?? frameTimestamp)
      : (payload.starts_at ?? frameTimestamp)
  return {
    id: eventKey(title, payload.starts_at),
    title,
    description,
    type: toEventType(payload.event_type),
    status,
    timestamp,
    startsAt: payload.starts_at ?? null,
    endsAt: payload.ends_at ?? null
  }
}

export const createBoardStore = (snapshot: BoardSnapshot) => {
  const now = new Date().toISOString()
  const eventFeed = (snapshot.events ?? [])
    .map(mapSnapshotEvent)
    .slice(0, EVENT_FEED_LIMIT)

  const { subscribe, update } = writable<BoardState>({
    bar: snapshot.bar,
    drinks: (snapshot.drinks ?? []).map((drink) =>
      normalizeSnapshotDrink(drink, snapshot.updated_at ?? now)
    ),
    connection: initialConnectionState(),
    activeEvent: eventFeed.find((event) => event.status === 'running') ?? null,
    eventFeed,
    lastUpdated: snapshot.updated_at ?? null
  })

  let clearTimer: ReturnType<typeof setTimeout> | null = null

  const cancelClear = () => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer)
      clearTimer = null
    }
  }

  const applyPriceUpdate = (
    payload: MarketPayloads['prices.update'],
    timestamp?: string
  ) => {
    const updates = (payload.prices ?? [])
      .map(normalizePriceRow)
      .filter((row): row is DrinkSnapshot => row !== null)
    if (!updates.length) {
      return
    }
    const receivedAt = timestamp ?? new Date().toISOString()

    update((state) => {
      const existing = new Map(state.drinks.map((drink) => [drink.id, drink]))
      const merged = new Map<string, DrinkSnapshot>()
      for (const entry of updates) {
        const previous = existing.get(entry.id)
        const incomingHistory = entry.history.length
          ? entry.history
          : [{ timestamp: receivedAt, price: entry.price }]
        merged.set(entry.id, {
          ...entry,
          name: entry.name || previous?.name || entry.id,
          base_price: entry.base_price ?? previous?.base_price ?? null,
          history: mergeHistory(previous?.history ?? [], incomingHistory)
        })
      }
      // Every `prices.update` frame lists all drinks of the bar, so drinks
      // missing from it were removed. Known drinks keep their position; new
      // ones are appended.
      const drinks = [
        ...state.drinks.flatMap((drink) => merged.get(drink.id) ?? []),
        ...[...merged.values()].filter((drink) => !existing.has(drink.id))
      ]
      return { ...state, drinks, lastUpdated: receivedAt }
    })
  }

  const applyEvent = (
    type: 'event.started' | 'event.ended',
    payload: ActiveEventPayload,
    timestamp?: string
  ) => {
    const status: BoardEventStatus =
      type === 'event.ended' ? 'ended' : 'running'
    const incoming = mapFrameEvent(
      payload,
      status,
      timestamp ?? new Date().toISOString()
    )

    update((state) => {
      const existing = state.eventFeed.find((event) => event.id === incoming.id)
      if (existing && existing.status === incoming.status) {
        // Re-sent on every (re)connect for already running events.
        return state
      }
      const merged: BoardEvent = {
        ...incoming,
        title: incoming.title ?? existing?.title ?? null,
        description: incoming.description || existing?.description || '',
        type: incoming.type ?? existing?.type ?? null
      }
      const eventFeed = [
        merged,
        ...state.eventFeed.filter((event) => event.id !== merged.id)
      ].slice(0, EVENT_FEED_LIMIT)

      let activeEvent = state.activeEvent
      if (status === 'running') {
        activeEvent = merged
      } else if (!activeEvent || activeEvent.id === merged.id) {
        activeEvent = merged
      }
      return { ...state, eventFeed, activeEvent }
    })

    if (status === 'running') {
      cancelClear()
      return
    }
    cancelClear()
    clearTimer = setTimeout(() => {
      clearTimer = null
      update((state) =>
        state.activeEvent?.status === 'ended'
          ? { ...state, activeEvent: null }
          : state
      )
    }, ENDED_EVENT_DISPLAY_MS)
  }

  const setConnection = (connection: ConnectionState) => {
    update((state) => ({ ...state, connection }))
  }

  const destroy = () => {
    cancelClear()
  }

  return {
    subscribe,
    applyPriceUpdate,
    applyEvent,
    setConnection,
    destroy
  }
}

export type BoardStore = ReturnType<typeof createBoardStore>
