import { get } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBoardStore,
  ENDED_EVENT_DISPLAY_MS,
  MAX_HISTORY_POINTS,
  mergeHistory,
  type BoardSnapshot
} from '$lib/stores/board'

const snapshot = (): BoardSnapshot => ({
  bar: { id: 1, slug: 'main-stage', name: 'Main Stage' },
  drinks: [
    {
      id: '1',
      name: 'Lager',
      price: 4.5,
      delta: 0,
      trend: 'flat',
      history: [{ timestamp: '2026-09-23T10:00:00+00:00', price: 4.5 }]
    }
  ],
  events: [
    {
      title: 'Happy Hour',
      description: 'Everything cheaper',
      status: 'running',
      starts_at: '2026-09-23T09:55:00+00:00',
      ends_at: '2026-09-23T10:25:00+00:00'
    }
  ],
  updated_at: '2026-09-23T10:00:00+00:00'
})

describe('createBoardStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hydrates from the REST snapshot without inventing data', () => {
    const state = get(createBoardStore(snapshot()))
    expect(state.bar?.slug).toBe('main-stage')
    expect(state.drinks.map((drink) => drink.name)).toEqual(['Lager'])
    expect(state.connection.status).toBe('connecting')
    expect(state.lastUpdated).toBe('2026-09-23T10:00:00+00:00')
    expect(state.activeEvent).toMatchObject({
      title: 'Happy Hour',
      status: 'running'
    })
  })

  it('merges live price rows and de-duplicates history by timestamp', () => {
    const store = createBoardStore(snapshot())
    store.applyPriceUpdate(
      {
        prices: [
          {
            drink_id: 1,
            drink_name: 'Lager',
            price: '4.80',
            base_price: '4.50',
            delta: '0.30',
            trend: 'flat',
            history: [
              { timestamp: '2026-09-23T10:00:00+00:00', price: '4.50' },
              { timestamp: '2026-09-23T10:01:00+00:00', price: '4.80' }
            ]
          },
          {
            drink_id: 2,
            drink_name: 'Spritz',
            price: '6.00',
            delta: '-0.50'
          }
        ],
        active_events: []
      },
      '2026-09-23T10:01:00+00:00'
    )

    const state = get(store)
    expect(state.lastUpdated).toBe('2026-09-23T10:01:00+00:00')
    expect(state.drinks.map((drink) => drink.id)).toEqual(['1', '2'])
    const [lager, spritz] = state.drinks
    expect(lager).toMatchObject({ price: 4.8, delta: 0.3, trend: 'up' })
    expect(lager.history).toEqual([
      { timestamp: '2026-09-23T10:00:00+00:00', price: 4.5 },
      { timestamp: '2026-09-23T10:01:00+00:00', price: 4.8 }
    ])
    expect(spritz).toMatchObject({ name: 'Spritz', trend: 'down' })
    expect(spritz.history).toEqual([
      { timestamp: '2026-09-23T10:01:00+00:00', price: 6 }
    ])
  })

  it('treats each update as the full drink list and keeps row order', () => {
    const store = createBoardStore(snapshot())
    store.applyPriceUpdate({
      prices: [
        { drink_id: 2, drink_name: 'Spritz', price: '6.00' },
        { drink_id: 1, drink_name: 'Lager', price: '4.60' }
      ]
    })
    expect(get(store).drinks.map((drink) => drink.name)).toEqual([
      'Lager',
      'Spritz'
    ])

    // Lager was deleted in the admin: it disappears from boards and desks.
    store.applyPriceUpdate({
      prices: [{ drink_id: 2, drink_name: 'Spritz', price: '6.10' }]
    })
    expect(get(store).drinks.map((drink) => drink.name)).toEqual(['Spritz'])
  })

  it('ignores rows without id or price', () => {
    const store = createBoardStore(snapshot())
    const before = get(store)
    store.applyPriceUpdate({ prices: [{ drink_name: '' }, { drink_id: 3 }] })
    expect(get(store)).toBe(before)
  })

  it('tracks live events without duplicating re-sent frames', () => {
    const store = createBoardStore(snapshot())
    const running = {
      event_id: 7,
      definition_name: 'Happy Hour',
      starts_at: '2026-09-23T09:55:00+00:00',
      ends_at: '2026-09-23T10:25:00+00:00'
    }

    // Sent again by the backend on every (re)connect.
    store.applyEvent('event.started', running)
    expect(get(store).eventFeed).toHaveLength(1)

    store.applyEvent('event.ended', running, '2026-09-23T10:25:00+00:00')
    let state = get(store)
    expect(state.eventFeed).toHaveLength(1)
    expect(state.eventFeed[0]).toMatchObject({
      status: 'ended',
      description: 'Everything cheaper'
    })
    expect(state.activeEvent?.status).toBe('ended')

    vi.advanceTimersByTime(ENDED_EVENT_DISPLAY_MS)
    state = get(store)
    expect(state.activeEvent).toBeNull()
  })

  it('keeps the base price across live updates that omit it', () => {
    const store = createBoardStore({
      ...snapshot(),
      drinks: [{ ...snapshot().drinks[0], base_price: 4 }]
    })
    expect(get(store).drinks[0].base_price).toBe(4)

    store.applyPriceUpdate(
      { prices: [{ drink_id: 1, drink_name: 'Lager', price: '4.80' }] },
      '2026-09-23T10:00:05+00:00'
    )
    expect(get(store).drinks[0]).toMatchObject({ price: 4.8, base_price: 4 })

    store.applyPriceUpdate(
      { prices: [{ drink_id: 1, price: '4.90', base_price: '4.20' }] },
      '2026-09-23T10:00:10+00:00'
    )
    expect(get(store).drinks[0].base_price).toBe(4.2)
  })

  it('maps event type and time window from frames and snapshots', () => {
    const store = createBoardStore({
      ...snapshot(),
      events: [{ ...snapshot().events![0], event_type: 'crash' }]
    })
    expect(get(store).activeEvent).toMatchObject({
      type: 'crash',
      startsAt: '2026-09-23T09:55:00+00:00',
      endsAt: '2026-09-23T10:25:00+00:00'
    })

    store.applyEvent('event.started', {
      definition_name: 'Rush Hour',
      event_type: 'boom',
      description: 'Everyone wants lager',
      starts_at: '2026-09-23T10:30:00+00:00',
      ends_at: '2026-09-23T10:40:00+00:00'
    })
    expect(get(store).activeEvent).toMatchObject({
      title: 'Rush Hour',
      type: 'boom',
      description: 'Everyone wants lager',
      endsAt: '2026-09-23T10:40:00+00:00'
    })

    store.applyEvent('event.started', {
      definition_name: 'Mystery',
      event_type: 'unknown-kind',
      starts_at: '2026-09-23T10:50:00+00:00'
    })
    expect(get(store).activeEvent?.type).toBeNull()
  })

  it('keeps an unnamed event title null for a translated fallback', () => {
    const store = createBoardStore({ ...snapshot(), events: [] })
    store.applyEvent('event.started', { event_id: 9, starts_at: 'x' })
    expect(get(store).activeEvent?.title).toBeNull()
  })

  it('stores the connection state reported by the socket', () => {
    const store = createBoardStore(snapshot())
    store.setConnection({
      status: 'reconnecting',
      attempt: 3,
      nextRetryAt: 123,
      closeCode: 1006
    })
    expect(get(store).connection).toEqual({
      status: 'reconnecting',
      attempt: 3,
      nextRetryAt: 123,
      closeCode: 1006
    })
  })
})

describe('mergeHistory', () => {
  it('sorts chronologically and clamps to the display window', () => {
    const points = Array.from({ length: MAX_HISTORY_POINTS + 5 }, (_, i) => ({
      timestamp: new Date(Date.UTC(2026, 8, 23, 10, i)).toISOString(),
      price: i
    }))
    const merged = mergeHistory(points.slice(10), points.slice(0, 10).reverse())
    expect(merged).toHaveLength(MAX_HISTORY_POINTS)
    expect(merged[0].price).toBe(5)
    expect(merged[merged.length - 1].price).toBe(MAX_HISTORY_POINTS + 4)
  })
})
