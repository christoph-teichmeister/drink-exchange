import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDelta, formatTime } from '$lib/utils/format'

// Intl output may contain narrow no-break spaces; normalise for comparison.
const normalize = (value: string | null) =>
  value?.replace(/[\u00a0\u202f]/g, ' ') ?? null

describe('format helpers', () => {
  it('formats currency according to the UI locale', () => {
    expect(normalize(formatCurrency(4.5, 'de'))).toBe('4,50 €')
    expect(normalize(formatCurrency(4.5, 'en'))).toBe('€4.50')
    expect(normalize(formatCurrency(null, 'en'))).toBe('€0.00')
  })

  it('formats deltas with an explicit sign', () => {
    expect(formatDelta(0.3, 'de')).toBe('+0,30')
    expect(formatDelta(-0.3, 'en')).toBe('-0.30')
    expect(formatDelta(0, 'en')).toBe('0.00')
  })

  it('returns null for missing or invalid timestamps', () => {
    expect(formatTime(null, 'en')).toBeNull()
    expect(formatTime('not a date', 'en')).toBeNull()
    expect(formatTime('2026-09-23T10:00:00Z', 'de', true)).toMatch(
      /^\d{2}:\d{2}:\d{2}$/
    )
  })
})
