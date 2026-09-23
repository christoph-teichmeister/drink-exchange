import { describe, expect, it } from 'vitest'
import {
  catalog,
  interpolate,
  matchSupportedLocale,
  parseAcceptLanguage
} from '$lib/i18n'

const keyPaths = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) {
    return [prefix]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe('i18n catalog', () => {
  it('has identical key sets for every locale', () => {
    expect(keyPaths(catalog.de).sort()).toEqual(keyPaths(catalog.en).sort())
  })

  it('has no empty strings', () => {
    for (const locale of Object.values(catalog)) {
      const leaves = keyPaths(locale).map((path) =>
        path
          .split('.')
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            locale
          )
      )
      expect(leaves.every((leaf) => typeof leaf === 'string' && leaf)).toBe(
        true
      )
    }
  })
})

describe('locale matching', () => {
  it('matches supported locales including regional variants', () => {
    expect(matchSupportedLocale('de-AT')).toBe('de')
    expect(matchSupportedLocale('EN')).toBe('en')
    expect(matchSupportedLocale('fr')).toBeUndefined()
    expect(matchSupportedLocale(null)).toBeUndefined()
  })

  it('picks the first supported Accept-Language entry', () => {
    expect(parseAcceptLanguage('fr-FR,fr;q=0.9,de;q=0.8,en;q=0.7')).toBe('de')
    expect(parseAcceptLanguage('')).toBeUndefined()
  })
})

describe('interpolate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(interpolate('Attempt {attempt} in {seconds}s', { attempt: 2 })).toBe(
      'Attempt 2 in {seconds}s'
    )
  })
})
