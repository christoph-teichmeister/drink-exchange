import type { DrinkHistoryPoint, TrendValue } from '$lib/stores/board'

export type BaseChange = { absolute: number; percent: number }

// Change of the current price against the drink's base price, which is the
// reference the market reverts to (the terminal's equivalent of "vs. open").
export const changeFromBase = (
  price: number,
  basePrice: number | null | undefined
): BaseChange | null => {
  if (basePrice === null || basePrice === undefined || basePrice <= 0) {
    return null
  }
  const absolute = price - basePrice
  return { absolute, percent: (absolute / basePrice) * 100 }
}

// Direction of the most recent tick, derived from the last two history points.
export const lastMove = (history: DrinkHistoryPoint[]): TrendValue => {
  if (history.length < 2) {
    return 'flat'
  }
  const previous = history[history.length - 2].price
  const latest = history[history.length - 1].price
  if (latest > previous) return 'up'
  if (latest < previous) return 'down'
  return 'flat'
}

export const directionOf = (value: number): TrendValue => {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

// Remaining time as m:ss (or h:mm:ss for long events).
export const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`
}

export const eventProgress = (
  startsAt: string | null,
  endsAt: string | null,
  now: number
): number | null => {
  const start = startsAt ? Date.parse(startsAt) : Number.NaN
  const end = endsAt ? Date.parse(endsAt) : Number.NaN
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null
  }
  return Math.min(1, Math.max(0, (now - start) / (end - start)))
}
