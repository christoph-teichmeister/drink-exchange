import { describe, expect, it } from 'vitest'
import { formatNumberInput, parseLocaleNumber } from '$lib/utils/locale-number'

describe('parseLocaleNumber', () => {
  it('reads German decimal commas and ignores grouping', () => {
    expect(parseLocaleNumber('1,5', 'de')).toBe(1.5)
    expect(parseLocaleNumber('1.234,56', 'de')).toBe(1234.56)
    expect(parseLocaleNumber(' 7 ', 'de')).toBe(7)
  })

  it('reads English decimal points', () => {
    expect(parseLocaleNumber('1.5', 'en')).toBe(1.5)
    expect(parseLocaleNumber('1,234.5', 'en')).toBe(1234.5)
    expect(parseLocaleNumber('-0.25', 'en')).toBe(-0.25)
  })

  it('returns null for empty and NaN for invalid input', () => {
    expect(parseLocaleNumber('', 'de')).toBeNull()
    expect(parseLocaleNumber('   ', 'en')).toBeNull()
    expect(parseLocaleNumber('abc', 'en')).toBeNaN()
    expect(parseLocaleNumber('1,2,3', 'de')).toBeNaN()
  })
})

describe('formatNumberInput', () => {
  it('uses the locale decimal separator without grouping', () => {
    expect(formatNumberInput(1234.5, 'de')).toBe('1234,5')
    expect(formatNumberInput(1234.5, 'en')).toBe('1234.5')
    expect(formatNumberInput(0.05, 'de')).toBe('0,05')
  })

  it('renders missing values as empty strings', () => {
    expect(formatNumberInput(null, 'de')).toBe('')
    expect(formatNumberInput(undefined, 'en')).toBe('')
  })
})
