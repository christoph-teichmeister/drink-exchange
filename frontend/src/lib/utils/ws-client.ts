export type MarketPayload = {
  rates?: { id: string; price: string }[]
  event?: { title: string; description: string }
  [key: string]: unknown
}

type MarketEventHandler = (_payload: MarketPayload) => void

type MarketSocket = ReturnType<typeof createMarketWebSocket>

const defaultPrices = [
  { id: 'barrel', price: '€23.12' },
  { id: 'lager', price: '€18.41' },
  { id: 'mixology', price: '€31.67' }
]

const defaultEvents = [
  { title: 'Event: Rush Hour', description: 'Incoming surge from district 3' },
  {
    title: 'Event: Calm Markets',
    description: 'Liquidity stabilized at 21:14'
  },
  { title: 'Event: High Demand', description: 'VIP board queued for orders' }
]

export function createMarketWebSocket(barId: string) {
  const listeners = new Map<string, Set<MarketEventHandler>>()
  const wildcard = new Map<string, Set<MarketEventHandler>>()
  const wsUrl = `${(
    import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000'
  ).replace(/\/+$/, '')}/ws/market/${barId}/`
  const reconnectDelay = 2000
  let socket: WebSocket | null = null
  let mockTimer: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0

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
      return startMockFeed()
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

      socket.addEventListener('close', () => {
        attemptReconnect()
      })

      socket.addEventListener('open', () => {
        reconnectAttempts = 0
        stopMockFeed()
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

  const startMockFeed = () => {
    stopMockFeed()
    let index = 0
    mockTimer = setInterval(() => {
      dispatchPayload('prices.update', {
        rates: defaultPrices.map((rate) => ({
          ...rate,
          price: `${rate.price} +${(index % 5) + 1}%`
        }))
      })
      const nextEvent = defaultEvents[index % defaultEvents.length]
      dispatchPayload(`event.${index}`, { event: nextEvent })
      index += 1
    }, 4000)
  }

  const stopMockFeed = () => {
    if (mockTimer) {
      clearInterval(mockTimer)
      mockTimer = null
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
