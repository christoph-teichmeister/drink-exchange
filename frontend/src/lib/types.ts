export type AuthUser = {
  username: string
  email: string
  first_name: string
  last_name: string
}

export type BarRole = 'operator' | 'manager'

export type BarSummary = {
  slug: string
  name: string
  description: string
  role: BarRole
}

// Shapes of the bar configuration API (backend/bars/config_payloads.py).
export type BarSettings = {
  slug: string
  name: string
  description: string
  tick_interval_seconds: number
  reversion_rate: number
  impulse_factor: number
  normalization_factor: number
  price_point_retention_ticks: number
}

export type DrinkConfig = {
  id: number
  name: string
  base_price: number
  current_price: number
  min_price: number
  max_price: number
  volatility: number
  weight: number
  rounding_step: number | null
  has_trades: boolean
}

export type EventType = 'boom' | 'crash' | 'focus' | 'normalize'

export type EventConfig = {
  id: number
  name: string
  description: string
  type: EventType
  probability_weight: number
  duration_seconds: number
  cooldown_seconds: number | null
  params: { start_multiplier: number | null; target_drink_ids: number[] }
}
