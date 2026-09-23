import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeBackoffDelay,
  createMarketWebSocket,
  FORBIDDEN_CLOSE_CODE,
  UNAUTHENTICATED_CLOSE_CODE,
  type ConnectionState,
  type ConnectivityEnvironment
} from '$lib/utils/ws-client'

class FakeSocket {
  static instances: FakeSocket[] = []

  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  closed = false

  constructor(readonly url: string) {
    FakeSocket.instances.push(this)
  }

  close() {
    this.closed = true
  }

  // Test helpers simulating server/network behaviour.
  open() {
    this.onopen?.()
  }

  receive(data: unknown) {
    this.onmessage?.({
      data: typeof data === 'string' ? data : JSON.stringify(data)
    })
  }

  drop(code = 1006) {
    this.closed = true
    this.onclose?.({ code })
  }
}

class FakeEnvironment implements ConnectivityEnvironment {
  navigator = { onLine: true }
  private listeners = new Map<string, Set<() => void>>()

  addEventListener(type: string, listener: () => void) {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener)
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0)
  }

  goOffline() {
    this.navigator.onLine = false
    this.listeners.get('offline')?.forEach((listener) => listener())
  }

  goOnline() {
    this.navigator.onLine = true
    this.listeners.get('online')?.forEach((listener) => listener())
  }
}

const latest = () => FakeSocket.instances[FakeSocket.instances.length - 1]

const setup = () => {
  const environment = new FakeEnvironment()
  const client = createMarketWebSocket('main-stage', {
    url: 'ws://test/ws/market/main-stage/',
    createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
    environment,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    random: () => 1
  })
  const states: ConnectionState[] = []
  client.onStatus((state) => states.push(state))
  return { client, environment, states }
}

describe('computeBackoffDelay', () => {
  const options = { baseDelayMs: 1000, maxDelayMs: 30000 }

  it('grows exponentially and caps at the maximum', () => {
    const delays = [1, 2, 3, 4, 5, 6, 7, 20].map((attempt) =>
      computeBackoffDelay(attempt, { ...options, random: () => 1 })
    )
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000])
  })

  it('applies jitter within the upper half of the window', () => {
    expect(computeBackoffDelay(3, { ...options, random: () => 0 })).toBe(2000)
    expect(computeBackoffDelay(3, { ...options, random: () => 0.5 })).toBe(3000)
  })
})

describe('createMarketWebSocket', () => {
  beforeEach(() => {
    FakeSocket.instances = []
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('reports connecting and then connected', () => {
    const { client, states } = setup()
    client.connect()
    expect(client.getState().status).toBe('connecting')
    latest().open()
    expect(client.getState()).toMatchObject({ status: 'connected', attempt: 0 })
    expect(states.map((state) => state.status)).toContain('connecting')
    expect(latest().url).toBe('ws://test/ws/market/main-stage/')
  })

  it('reconnects with exponential backoff after unexpected closes', () => {
    const { client } = setup()
    client.connect()
    latest().drop()

    expect(client.getState()).toMatchObject({
      status: 'reconnecting',
      attempt: 1
    })
    expect(client.getState().nextRetryAt).toBe(Date.now() + 1000)
    expect(FakeSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(999)
    expect(FakeSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeSocket.instances).toHaveLength(2)

    latest().drop()
    expect(client.getState()).toMatchObject({ attempt: 2 })
    vi.advanceTimersByTime(2000)
    expect(FakeSocket.instances).toHaveLength(3)

    latest().open()
    expect(client.getState()).toMatchObject({ status: 'connected', attempt: 0 })
  })

  it('keeps retrying indefinitely without falling back to fake data', () => {
    const { client } = setup()
    const prices = vi.fn()
    client.on('prices.update', prices)
    client.connect()
    for (let attempt = 1; attempt <= 25; attempt += 1) {
      latest().drop()
      expect(client.getState().status).toBe('reconnecting')
      vi.advanceTimersByTime(30000)
    }
    expect(FakeSocket.instances).toHaveLength(26)
    expect(prices).not.toHaveBeenCalled()
  })

  it('never reconnects after an intentional disconnect', () => {
    const { client, environment } = setup()
    client.connect()
    const socket = latest()
    socket.open()
    client.disconnect()

    expect(socket.closed).toBe(true)
    // A late close event from the dropped socket must be ignored.
    socket.drop(1000)
    vi.advanceTimersByTime(120000)
    expect(FakeSocket.instances).toHaveLength(1)
    expect(environment.listenerCount()).toBe(0)
  })

  it('cancels a pending retry on disconnect', () => {
    const { client } = setup()
    client.connect()
    latest().drop()
    client.disconnect()
    vi.advanceTimersByTime(120000)
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('does not leave zombie sockets when reconnecting manually', () => {
    const { client } = setup()
    client.connect()
    const first = latest()
    first.open()

    client.reconnect()
    const second = latest()
    expect(first.closed).toBe(true)
    expect(second).not.toBe(first)

    // The replaced socket's close must not schedule yet another connection.
    first.drop(1000)
    vi.advanceTimersByTime(120000)
    expect(FakeSocket.instances).toHaveLength(2)

    second.open()
    expect(client.getState().status).toBe('connected')
  })

  it.each([UNAUTHENTICATED_CLOSE_CODE, FORBIDDEN_CLOSE_CODE])(
    'stops retrying and reports unauthorized on close code %i',
    (code) => {
      const { client } = setup()
      client.connect()
      latest().drop(code)
      expect(client.getState()).toMatchObject({
        status: 'unauthorized',
        closeCode: code,
        nextRetryAt: null
      })
      vi.advanceTimersByTime(120000)
      expect(FakeSocket.instances).toHaveLength(1)
    }
  )

  it('waits while offline and reconnects immediately once back online', () => {
    const { client, environment } = setup()
    client.connect()
    const socket = latest()
    socket.open()

    environment.goOffline()
    expect(client.getState().status).toBe('offline')
    expect(socket.closed).toBe(true)
    vi.advanceTimersByTime(120000)
    expect(FakeSocket.instances).toHaveLength(1)

    environment.goOnline()
    expect(FakeSocket.instances).toHaveLength(2)
    expect(client.getState()).toMatchObject({
      status: 'connecting',
      attempt: 0
    })
  })

  it('does not open a socket when starting offline', () => {
    const { client, environment } = setup()
    environment.navigator.onLine = false
    client.connect()
    expect(client.getState().status).toBe('offline')
    expect(FakeSocket.instances).toHaveLength(0)
    environment.goOnline()
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('dispatches frames by type and ignores malformed data', () => {
    const { client } = setup()
    const prices = vi.fn()
    const started = vi.fn()
    const unsubscribe = client.on('prices.update', prices)
    client.on('event.started', started)
    client.connect()
    const socket = latest()
    socket.open()

    const frame = {
      type: 'prices.update',
      bar_id: 'main-stage',
      timestamp: '2026-09-23T10:00:00+00:00',
      payload: { prices: [], active_events: [] }
    }
    socket.receive(frame)
    socket.receive('not json')
    socket.receive({ payload: {} })
    socket.receive({
      type: 'event.started',
      payload: { definition_name: 'Happy Hour' }
    })

    expect(prices).toHaveBeenCalledTimes(1)
    expect(prices).toHaveBeenCalledWith(frame.payload, frame)
    expect(started).toHaveBeenCalledWith(
      { definition_name: 'Happy Hour' },
      expect.objectContaining({ type: 'event.started' })
    )

    unsubscribe()
    socket.receive(frame)
    expect(prices).toHaveBeenCalledTimes(1)
  })
})
