import { describe, expect, it } from 'vitest'
import {
  changeFromBase,
  directionOf,
  eventProgress,
  formatCountdown,
  lastMove
} from '$lib/utils/market'

const point = (price: number, second: number) => ({
  timestamp: `2026-09-23T10:00:${String(second).padStart(2, '0')}+00:00`,
  price
})

describe('changeFromBase', () => {
  it('returns absolute and percent change against the base price', () => {
    const change = changeFromBase(5.5, 5)
    expect(change?.absolute).toBeCloseTo(0.5)
    expect(change?.percent).toBeCloseTo(10)
  })

  it('returns null without a usable base price', () => {
    expect(changeFromBase(5, null)).toBeNull()
    expect(changeFromBase(5, undefined)).toBeNull()
    expect(changeFromBase(5, 0)).toBeNull()
  })
})

describe('lastMove', () => {
  it('compares the two newest history points', () => {
    expect(lastMove([point(5, 0), point(5.2, 5)])).toBe('up')
    expect(lastMove([point(5.2, 0), point(5, 5)])).toBe('down')
    expect(lastMove([point(5, 0), point(5, 5)])).toBe('flat')
  })

  it('is flat without enough history', () => {
    expect(lastMove([])).toBe('flat')
    expect(lastMove([point(5, 0)])).toBe('flat')
  })
})

describe('directionOf', () => {
  it('maps signs to directions', () => {
    expect(directionOf(0.1)).toBe('up')
    expect(directionOf(-0.1)).toBe('down')
    expect(directionOf(0)).toBe('flat')
  })
})

describe('formatCountdown', () => {
  it('formats minutes and seconds, rounding partial seconds up', () => {
    expect(formatCountdown(125_000)).toBe('2:05')
    expect(formatCountdown(59_001)).toBe('1:00')
    expect(formatCountdown(3_725_000)).toBe('1:02:05')
  })

  it('never goes negative', () => {
    expect(formatCountdown(-5_000)).toBe('0:00')
  })
})

describe('eventProgress', () => {
  const start = '2026-09-23T10:00:00+00:00'
  const end = '2026-09-23T10:10:00+00:00'

  it('returns the elapsed share of the event window', () => {
    expect(eventProgress(start, end, Date.parse(start))).toBe(0)
    expect(
      eventProgress(start, end, Date.parse('2026-09-23T10:05:00+00:00'))
    ).toBe(0.5)
    expect(
      eventProgress(start, end, Date.parse('2026-09-23T11:00:00+00:00'))
    ).toBe(1)
  })

  it('returns null for missing or invalid windows', () => {
    expect(eventProgress(null, end, 0)).toBeNull()
    expect(eventProgress(end, start, 0)).toBeNull()
  })
})
