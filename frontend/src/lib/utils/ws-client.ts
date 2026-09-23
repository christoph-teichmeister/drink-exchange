import { wsConfig } from '$lib/config'

export type TrendValue = 'up' | 'down' | 'flat'

// Shapes mirror backend/market/serializers.py (build_*_payload helpers).
export type PriceHistoryPayload = {
  timestamp?: string
  price?: number | string
}

export type PriceRowPayload = {
  drink_id?: number | string
  drink_name?: string
  price?: number | string
  base_price?: number | string
  delta?: number | string
  trend?: TrendValue
  history?: PriceHistoryPayload[]
}

export type ActiveEventPayload = {
  event_id?: number | string
  definition_id?: number | string
  definition_name?: string
  starts_at?: string
  ends_at?: string
  is_active?: boolean
  [key: string]: unknown
}

export type MarketPayloads = {
  'prices.update': {
    prices?: PriceRowPayload[]
    active_events?: ActiveEventPayload[]
  }
  'event.started': ActiveEventPayload
  'event.ended': ActiveEventPayload
  'market.status': { status?: string; metadata?: Record<string, unknown> }
}

export type MarketFrameType = keyof MarketPayloads

export type MarketFrame = {
  type: string
  bar_id?: string
  timestamp?: string
  payload?: unknown
}

export type ConnectionStatus =
  'connecting' | 'connected' | 'reconnecting' | 'offline' | 'unauthorized'

export type ConnectionState = {
  status: ConnectionStatus
  // Consecutive failed connection attempts since the last successful open.
  attempt: number
  // Epoch milliseconds of the next scheduled retry, if one is pending.
  nextRetryAt: number | null
  // Close code of the last unexpected close, if any.
  closeCode: number | null
}

// Close codes sent by the backend consumer; retrying cannot fix these.
export const UNAUTHENTICATED_CLOSE_CODE = 4401
export const FORBIDDEN_CLOSE_CODE = 4403

export const initialConnectionState = (): ConnectionState => ({
  status: 'connecting',
  attempt: 0,
  nextRetryAt: null,
  closeCode: null
})

export type BackoffOptions = {
  baseDelayMs: number
  maxDelayMs: number
  random: () => number
}

// Exponential backoff with "equal jitter": the delay doubles per attempt up to
// the cap, and a random half of it is added so many boards reconnecting after a
// backend restart do not stampede the server at the same instant.
export const computeBackoffDelay = (
  attempt: number,
  { baseDelayMs, maxDelayMs, random }: BackoffOptions
) => {
  const exponent = Math.max(0, attempt - 1)
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** exponent)
  return Math.round(ceiling / 2 + random() * (ceiling / 2))
}

type ConnectivityListener = () => void

export type ConnectivityEnvironment = {
  navigator: { onLine: boolean }
  addEventListener: (
    type: 'online' | 'offline',
    listener: ConnectivityListener
  ) => void
  removeEventListener: (
    type: 'online' | 'offline',
    listener: ConnectivityListener
  ) => void
}

export type MarketSocketOptions = {
  url?: string
  createSocket?: (url: string) => WebSocket
  environment?: ConnectivityEnvironment
  baseDelayMs?: number
  maxDelayMs?: number
  random?: () => number
}

type FrameHandler<K extends MarketFrameType> = (
  payload: MarketPayloads[K],
  frame: MarketFrame
) => void

type AnyFrameHandler = (payload: unknown, frame: MarketFrame) => void

const isFrame = (value: unknown): value is MarketFrame =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { type?: unknown }).type === 'string'

export function createMarketWebSocket(
  barId: string,
  options: MarketSocketOptions = {}
) {
  const url = options.url ?? wsConfig.marketWebSocketUrl(barId)
  const createSocket =
    options.createSocket ?? ((target: string) => new WebSocket(target))
  const environment: ConnectivityEnvironment | undefined =
    options.environment ?? (typeof window === 'undefined' ? undefined : window)
  const backoff: BackoffOptions = {
    baseDelayMs: options.baseDelayMs ?? 1000,
    maxDelayMs: options.maxDelayMs ?? 30000,
    random: options.random ?? Math.random
  }

  const handlers = new Map<string, Set<AnyFrameHandler>>()
  const statusListeners = new Set<(state: ConnectionState) => void>()

  let state = initialConnectionState()
  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  // True between connect() and disconnect(). Closes that happen while inactive
  // are intentional and must never trigger a reconnect.
  let active = false

  const setState = (patch: Partial<ConnectionState>) => {
    state = { ...state, ...patch }
    statusListeners.forEach((listener) => listener(state))
  }

  const isOffline = () => environment?.navigator.onLine === false

  const clearRetry = () => {
    if (retryTimer !== null) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  // Detaches and closes the current socket so its late events are ignored.
  const dropSocket = () => {
    const current = socket
    socket = null
    if (!current) {
      return
    }
    current.onopen = null
    current.onmessage = null
    current.onclose = null
    current.onerror = null
    try {
      current.close(1000)
    } catch (error) {
      console.error('MarketWS close failed', error)
    }
  }

  const dispatch = (frame: MarketFrame) => {
    const payload = frame.payload ?? {}
    handlers.get(frame.type)?.forEach((handler) => {
      try {
        handler(payload, frame)
      } catch (error) {
        console.error('MarketWS handler failed', error)
      }
    })
  }

  const handleMessage = (data: unknown) => {
    if (typeof data !== 'string') {
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch {
      console.error('MarketWS received malformed frame')
      return
    }
    if (isFrame(parsed)) {
      dispatch(parsed)
    }
  }

  const scheduleReconnect = (closeCode: number | null) => {
    clearRetry()
    const attempt = state.attempt + 1
    const delay = computeBackoffDelay(attempt, backoff)
    setState({
      status: 'reconnecting',
      attempt,
      nextRetryAt: Date.now() + delay,
      closeCode
    })
    retryTimer = setTimeout(() => {
      retryTimer = null
      if (active) {
        openSocket()
      }
    }, delay)
  }

  const handleClose = (code: number) => {
    if (!active) {
      return
    }
    if (code === UNAUTHENTICATED_CLOSE_CODE || code === FORBIDDEN_CLOSE_CODE) {
      clearRetry()
      setState({ status: 'unauthorized', nextRetryAt: null, closeCode: code })
      return
    }
    if (isOffline()) {
      setState({ status: 'offline', nextRetryAt: null, closeCode: code })
      return
    }
    scheduleReconnect(code)
  }

  function openSocket() {
    clearRetry()
    dropSocket()

    if (isOffline()) {
      setState({ status: 'offline', nextRetryAt: null })
      return
    }

    setState({
      status: state.attempt > 0 ? 'reconnecting' : 'connecting',
      nextRetryAt: null
    })

    let ws: WebSocket
    try {
      ws = createSocket(url)
    } catch (error) {
      console.error('MarketWS connection could not be established', error)
      scheduleReconnect(null)
      return
    }

    socket = ws
    ws.onopen = () => {
      if (socket !== ws) return
      setState({
        status: 'connected',
        attempt: 0,
        nextRetryAt: null,
        closeCode: null
      })
    }
    ws.onmessage = (event: MessageEvent) => {
      if (socket !== ws) return
      handleMessage(event.data)
    }
    ws.onclose = (event: CloseEvent) => {
      if (socket !== ws) return
      socket = null
      handleClose(event.code)
    }
  }

  const handleOnline = () => {
    if (!active || state.status === 'unauthorized') {
      return
    }
    if (state.status === 'connected' && socket) {
      return
    }
    // Back online: retry immediately with a fresh backoff sequence.
    setState({ attempt: 0 })
    openSocket()
  }

  const handleOffline = () => {
    if (!active || state.status === 'unauthorized') {
      return
    }
    clearRetry()
    dropSocket()
    setState({ status: 'offline', nextRetryAt: null })
  }

  const connect = () => {
    if (active) {
      return
    }
    active = true
    environment?.addEventListener('online', handleOnline)
    environment?.addEventListener('offline', handleOffline)
    setState({ attempt: 0, closeCode: null })
    openSocket()
  }

  const disconnect = () => {
    if (!active) {
      return
    }
    active = false
    environment?.removeEventListener('online', handleOnline)
    environment?.removeEventListener('offline', handleOffline)
    clearRetry()
    dropSocket()
  }

  // Manual retry (e.g. the Reconnect button): restart immediately, even after
  // an `unauthorized` close, since the user may have signed in meanwhile.
  const reconnect = () => {
    if (!active) {
      connect()
      return
    }
    setState({ attempt: 0, closeCode: null })
    openSocket()
  }

  const on = <K extends MarketFrameType>(type: K, handler: FrameHandler<K>) => {
    const set = handlers.get(type) ?? new Set<AnyFrameHandler>()
    set.add(handler as AnyFrameHandler)
    handlers.set(type, set)
    return () => {
      set.delete(handler as AnyFrameHandler)
    }
  }

  const onStatus = (listener: (state: ConnectionState) => void) => {
    statusListeners.add(listener)
    listener(state)
    return () => {
      statusListeners.delete(listener)
    }
  }

  return {
    connect,
    disconnect,
    reconnect,
    on,
    onStatus,
    getState: () => state
  }
}

export type MarketSocket = ReturnType<typeof createMarketWebSocket>
