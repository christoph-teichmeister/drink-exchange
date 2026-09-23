import { writable } from 'svelte/store'
import type { MarketDrink, MarketPayload } from '$lib/utils/ws-client'

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
export type TrendValue = 'up' | 'down' | 'flat'

export type DrinkHistoryPoint = {
  timestamp: string
  price: number
}

export type DrinkSnapshot = {
  id: string
  name: string
  price: number
  delta: number
  trend: TrendValue
  history: DrinkHistoryPoint[]
}

export type EventSnapshot = {
  title: string
  description: string
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

type BoardEventStatus = 'started' | 'ended' | 'running'

type BoardEvent = {
  id: string
  title: string
  description: string
  status: BoardEventStatus
  timestamp: string
}

type BoardState = {
  bar: BoardSnapshot['bar'] | null
  drinks: DrinkSnapshot[]
  connection: ConnectionStatus
  activeEvent: BoardEvent | null
  eventFeed: BoardEvent[]
  lastUpdated: string | null
}

const MAX_HISTORY_POINTS = 24
const EVENT_FEED_LIMIT = 4

const getTrendFromDelta = (delta: number): TrendValue => {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}

const clampHistory = (points: DrinkHistoryPoint[]): DrinkHistoryPoint[] => {
  while (points.length > MAX_HISTORY_POINTS) {
    points.shift()
  }
  return points
}

const ensureDrinkHistory = (drink: DrinkSnapshot): DrinkSnapshot => {
  if (drink.history.length) {
    return drink
  }

  return {
    ...drink,
    history: [{ timestamp: new Date().toISOString(), price: drink.price }]
  }
}

const safeNumber = (value: unknown, fallback = 0) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const normalizeHistoryRow = (historyRow: {
  timestamp?: string
  price?: number | string
}): DrinkHistoryPoint | null => {
  const price = safeNumber(historyRow.price)
  if (!historyRow.timestamp || Number.isNaN(price)) {
    return null
  }
  return { timestamp: historyRow.timestamp, price }
}

const normalizeHistoryRows = (rows: unknown): DrinkHistoryPoint[] => {
  if (!Array.isArray(rows)) {
    return []
  }
  return rows
    .map((entry) =>
      normalizeHistoryRow(
        entry as { timestamp?: string; price?: number | string }
      )
    )
    .filter((point): point is DrinkHistoryPoint => point !== null)
}

const normalizePriceRow = (row: {
  drink_id?: string | number
  drink_name?: string
  price?: number | string
  delta?: number | string
  trend?: TrendValue
  history?: unknown
}): DrinkSnapshot => {
  const price = safeNumber(row.price)
  const delta = safeNumber(row.delta, 0)
  const trend = row.trend ?? getTrendFromDelta(delta)
  const id =
    row.drink_id !== undefined && row.drink_id !== null
      ? String(row.drink_id)
      : `${row.drink_name ?? 'drink'}-${Math.random().toString(36).slice(2, 6)}`
  const name = row.drink_name ?? id
  const historyPoints = normalizeHistoryRows(row.history)
  return {
    id,
    name,
    price,
    delta,
    trend,
    history: clampHistory(
      historyPoints.length
        ? historyPoints
        : [{ timestamp: new Date().toISOString(), price }]
    )
  }
}

type MarketHistoryPoint = NonNullable<MarketDrink['history']>[number]

const sanitizeHistory = (history: MarketHistoryPoint[]): DrinkHistoryPoint[] =>
  history
    .map((point) => ({
      timestamp: point.timestamp ?? new Date().toISOString(),
      price: safeNumber(point.price)
    }))
    .filter((point) => !Number.isNaN(point.price))

const normalizeDrinkSnapshot = (drink: MarketDrink): DrinkSnapshot => {
  const price = safeNumber(drink.price)
  const delta = safeNumber(drink.delta, 0)
  const history = sanitizeHistory(drink.history ?? [])
  const record: DrinkSnapshot = {
    id:
      drink.id ??
      `${drink.name ?? 'drink'}-${Math.random().toString(36).slice(2, 6)}`,
    name: drink.name ?? drink.id ?? 'Drink',
    price,
    delta,
    trend: (drink.trend as TrendValue) ?? getTrendFromDelta(delta),
    history: clampHistory(history)
  }
  return record
}

const parsePriceString = (value?: string) => {
  if (!value) return 0
  const sanitized = value.replace(/[^0-9.-]/g, '')
  const numeric = Number(sanitized)
  return Number.isFinite(numeric) ? numeric : 0
}

const normalizeRateUpdate = (rate: {
  id: string
  price?: string
}): DrinkSnapshot => {
  const price = parsePriceString(rate.price)
  return {
    id: rate.id,
    name: rate.id,
    price,
    delta: 0,
    trend: 'flat',
    history: [{ timestamp: new Date().toISOString(), price }]
  }
}

const normalizeMarketPayload = (payload: MarketPayload): DrinkSnapshot[] => {
  if (Array.isArray(payload.drinks) && payload.drinks.length) {
    return payload.drinks.map((drink) => normalizeDrinkSnapshot(drink))
  }
  if (Array.isArray(payload.rates) && payload.rates.length) {
    return payload.rates.map((rate) => normalizeRateUpdate(rate))
  }
  if (Array.isArray(payload.prices) && payload.prices.length) {
    return payload.prices.map((price) => normalizePriceRow(price))
  }
  return []
}

const buildBoardEvent = (
  type: string,
  payload: MarketPayload
): BoardEvent | null => {
  if (!payload.event) {
    return null
  }
  const timestamp = new Date().toISOString()
  const status: BoardEventStatus = type.endsWith('ended')
    ? 'ended'
    : type.endsWith('started')
    ? 'started'
    : 'running'

  return {
    id: `${type}:${timestamp}`,
    title: String(payload.event.title ?? 'Live Event'),
    description: String(payload.event.description ?? ''),
    status,
    timestamp
  }
}

const mapSnapshotEvents = (events?: EventSnapshot[]): BoardEvent[] => {
  return (events ?? [])
    .map((event) => {
      const status: BoardEventStatus =
        event.status === 'ended'
          ? 'ended'
          : event.status === 'running'
          ? 'running'
          : 'started'

      return {
        id: `${event.title}:${
          event.starts_at ?? event.ends_at ?? event.status
        }`,
        title: event.title,
        description: event.description,
        status,
        timestamp: event.starts_at ?? event.ends_at ?? new Date().toISOString()
      }
    })
    .slice(0, EVENT_FEED_LIMIT)
}

const createBoardStore = (initialSnapshot?: BoardSnapshot) => {
  const initialEvents = mapSnapshotEvents(initialSnapshot?.events)
  const initialDrinks = (initialSnapshot?.drinks ?? []).map(ensureDrinkHistory)
  const initialState: BoardState = {
    bar: initialSnapshot?.bar ?? null,
    drinks: initialDrinks,
    connection: 'connecting',
    activeEvent:
      initialEvents.find((event) => event.status === 'started') ?? null,
    eventFeed: initialEvents,
    lastUpdated: initialSnapshot?.updated_at ?? new Date().toISOString()
  }

  const { subscribe, set, update } = writable(initialState)
  let eventTimer: ReturnType<typeof setTimeout> | null = null

  const clearActiveEvent = () => {
    update((value) => ({ ...value, activeEvent: null }))
  }

  const scheduleEventClear = (delay: number) => {
    if (eventTimer) {
      clearTimeout(eventTimer)
    }
    eventTimer = setTimeout(() => {
      clearActiveEvent()
      eventTimer = null
    }, delay)
  }

  const mergeDrink = (
    existing: DrinkSnapshot | undefined,
    update: DrinkSnapshot
  ): DrinkSnapshot => {
    const newPoint = {
      timestamp: new Date().toISOString(),
      price: update.price
    }
    const incomingHistory = update.history.length
      ? update.history.slice()
      : [newPoint]

    const history =
      existing && existing.history.length
        ? clampHistory([...existing.history, ...incomingHistory])
        : clampHistory(incomingHistory)
    const previousPrice = existing?.price ?? update.price
    const delta =
      typeof update.delta === 'number'
        ? update.delta
        : update.price - previousPrice
    const trend = update.trend ?? getTrendFromDelta(delta)

    return {
      id: update.id,
      name: update.name ?? existing?.name ?? update.id,
      price: update.price,
      delta,
      trend,
      history
    }
  }

  const setSnapshot = (snapshot: BoardSnapshot) => {
    const events = mapSnapshotEvents(snapshot.events)
    set({
      bar: snapshot.bar,
      drinks: snapshot.drinks.map(ensureDrinkHistory),
      connection: 'connecting',
      activeEvent: events.find((event) => event.status === 'started') ?? null,
      eventFeed: events,
      lastUpdated: snapshot.updated_at ?? new Date().toISOString()
    })
    if (events.length) {
      scheduleEventClear(12000)
    }
  }

  const applyPriceUpdate = (payload: MarketPayload) => {
    const updates = normalizeMarketPayload(payload)
    if (!updates.length) {
      return
    }

    update((state) => {
      const drinkMap = new Map(state.drinks.map((drink) => [drink.id, drink]))
      updates.forEach((entry) => {
        const existing = drinkMap.get(entry.id)
        drinkMap.set(entry.id, mergeDrink(existing, entry))
      })

      const nextDrinks = [
        ...state.drinks.map((drink) => drinkMap.get(drink.id) ?? drink),
        ...updates
          .filter(
            (entry) => !state.drinks.some((drink) => drink.id === entry.id)
          )
          .map((entry) => drinkMap.get(entry.id) ?? entry)
      ]

      return {
        ...state,
        drinks: nextDrinks,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  const addEventToFeed = (event: BoardEvent) => {
    update((state) => ({
      ...state,
      eventFeed: [event, ...state.eventFeed].slice(0, EVENT_FEED_LIMIT)
    }))
  }

  const queueEvent = (eventType: string, payload: MarketPayload) => {
    const boardEvent = buildBoardEvent(eventType, payload)
    if (!boardEvent) {
      return
    }

    addEventToFeed(boardEvent)
    update((state) => ({
      ...state,
      activeEvent: boardEvent
    }))

    if (boardEvent.status === 'ended') {
      scheduleEventClear(8000)
    } else {
      scheduleEventClear(12000)
    }
  }

  const setConnectionStatus = (connection: ConnectionStatus) => {
    update((state) => ({ ...state, connection }))
  }

  const destroy = () => {
    if (eventTimer) {
      clearTimeout(eventTimer)
      eventTimer = null
    }
  }

  return {
    subscribe,
    setSnapshot,
    applyPriceUpdate,
    queueEvent,
    setConnectionStatus,
    destroy
  }
}

type BoardStore = ReturnType<typeof createBoardStore>

export { createBoardStore }
export type { BoardStore }
