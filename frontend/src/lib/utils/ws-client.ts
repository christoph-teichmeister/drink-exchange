import { wsConfig } from '$lib/config'

export type MarketDrink = {
  id: string
  name?: string
  price: number | string
  delta?: number
  trend?: 'up' | 'down' | 'flat'
  history?: { timestamp?: string; price: number | string }[]
}

export type MarketPayload = {
  drinks?: MarketDrink[]
  rates?: { id: string; price: string }[]
  event?: { title?: string; description?: string }
  [key: string]: unknown
}

type MarketEventHandler = (_payload: MarketPayload) => void

type MarketSocket = ReturnType<typeof createMarketWebSocket>

const baseDrinks = [
  { id: 'barrel', name: 'Barrel ETF', price: 23.15 },
  { id: 'lager', name: 'Lager Index', price: 18.41 },
  { id: 'mixology', name: 'Mixology Blend', price: 31.67 },
  { id: 'spritz', name: 'Spritz Circuit', price: 12.04 }
]

const mockEvents = [
  { type: 'event.started', event: { title: 'Rush Hour', description: 'Incoming surge from district 3' } },
  { type: 'event.ended', event: { title: 'Rush Hour', description: 'MPA flush completed' } },
  { type: 'event.started', event: { title: 'Calm Markets', description: 'Liquidity stabilized across drinks' } },
  { type: 'event.ended', event: { title: 'Calm Markets', description: 'Standing down' } }
]

const buildHistory = (price: number) => {
  const points = []
  const start = Date.now() - 7 * 60 * 1000
  for (let index = 0; index < 8; index += 1) {
    points.push({
      timestamp: new Date(start + index * 60 * 1000).toISOString(),
      price: Number((price + (index - 4) * 0.15).toFixed(2))
    })
  }
  return points
}

export function createMarketWebSocket(barId: string) {
  const listeners = new Map<string, Set<MarketEventHandler>>()
  const wildcard = new Map<string, Set<MarketEventHandler>>()
  const wsUrl = wsConfig.marketWebSocketUrl(barId)
  const reconnectDelay = 2000
  let socket: WebSocket | null = null
  let mockTimer: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0
  let mockEventIndex = 0
  let mockDrinks: MarketDrink[] = []

  const resetMockDrinks = () => {
    mockDrinks = baseDrinks.map((drink) => ({
      ...drink,
      history: buildHistory(Number(drink.price)),
      delta: 0,
      trend: 'flat'
    }))
  }
  resetMockDrinks()
  let mockActive = false

  const dispatchPayload = (type: string, data: MarketPayload) => {
    listeners.get(type)?.forEach((handler) => handler(data))
    wildcard.forEach((set, pattern) => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1)
        if (type.startsWith(prefix)) {
          set.forEach((handler) => handler({ ...data, type }))
        }
      }
    })
  }

  const connect = () => {
    if (typeof window === 'undefined') {
      startMockFeed()
      return
    }

    disconnect()

    if (typeof WebSocket === 'undefined') {
      startMockFeed()
      return
    }

    try {
      socket = new WebSocket(wsUrl)

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type && payload.data) {
            dispatchPayload(payload.type, payload.data)
          }
        } catch (error) {
          console.error('MarketWS message handler failed', error)
        }
      })

      socket.addEventListener('close', (event) => {
        dispatchPayload('ws.close', { code: event.code, reason: event.reason })
        attemptReconnect()
      })

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        stopMockFeed()
        dispatchPayload('ws.open', { mock: false })
      })
    } catch (error) {
      startMockFeed()
      console.error('MarketWS connection could not be established', error)
    }
  }

  const attemptReconnect = () => {
    reconnectAttempts += 1
    if (reconnectAttempts > 5) {
      startMockFeed()
      return
    }
    setTimeout(connect, reconnectDelay)
  }

  const emitMockPrices = () => {
    mockDrinks = mockDrinks.map((drink) => {
      const delta = Number(((Math.random() - 0.5) * 0.6).toFixed(2))
      const nextPrice = Number(Math.max(6, Number(drink.price) + delta).toFixed(2))
      const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
      const history = [...(drink.history ?? [])]
      history.push({ timestamp: new Date().toISOString(), price: nextPrice })
      if (history.length > 24) {
        history.shift()
      }

      return {
        ...drink,
        price: nextPrice,
        delta,
        trend,
        history
      }
    })

    const snapshot = mockDrinks.map((drink) => ({
      id: drink.id,
      name: drink.name,
      price: drink.price,
      delta: drink.delta,
      trend: drink.trend,
      history: drink.history?.slice() ?? []
    }))

    dispatchPayload('prices.update', { drinks: snapshot })
  }

  const emitMockEvent = () => {
    const signal = mockEvents[mockEventIndex % mockEvents.length]
    dispatchPayload(signal.type, { event: signal.event })
    mockEventIndex += 1
  }

  const startMockFeed = () => {
    stopMockFeed()
    mockEventIndex = 0
    resetMockDrinks()
    mockTimer = setInterval(() => {
      emitMockPrices()
      emitMockEvent()
    }, 4000)
    mockActive = true
    dispatchPayload('ws.open', { mock: true })
  }

  const stopMockFeed = () => {
    if (mockTimer) {
      clearInterval(mockTimer)
      mockTimer = null
    }
    if (mockActive) {
      dispatchPayload('ws.close', { mock: true })
      mockActive = false
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.close()
      socket = null
    }
    stopMockFeed()
  }

  const reconnect = () => {
    stopMockFeed()
    reconnectAttempts = 0
    connect()
  }

  const on = (eventType: string, handler: MarketEventHandler) => {
    if (eventType.includes('*')) {
      const set = wildcard.get(eventType) ?? new Set()
      set.add(handler)
      wildcard.set(eventType, set)
      return
    }
    const set = listeners.get(eventType) ?? new Set()
    set.add(handler)
    listeners.set(eventType, set)
  }

  const off = (eventType: string, handler: MarketEventHandler) => {
    const store = eventType.includes('*')
      ? wildcard.get(eventType)
      : listeners.get(eventType)
    store?.delete(handler)
  }

  return {
    connect,
    reconnect,
    disconnect,
    on,
    off,
    isConnected: () => Boolean(socket)
  }
}

export type { MarketSocket }
