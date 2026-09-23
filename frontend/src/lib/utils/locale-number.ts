import type { Locale } from '$lib/i18n'

const separators = (locale: Locale) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.'
  }
}

// Parses user input in the active locale ("1,5" in German, "1.5" in English).
// Returns null for empty input and NaN for anything that is not a number.
export const parseLocaleNumber = (
  text: string,
  locale: Locale
): number | null => {
  const trimmed = text.trim().replace(/\s/g, '')
  if (!trimmed) {
    return null
  }
  const { group, decimal } = separators(locale)
  const normalized = trimmed.split(group).join('').replace(decimal, '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return Number.NaN
  }
  return Number(normalized)
}

// Formats a number for an input field: locale decimal separator, no grouping,
// no trailing zeros beyond what the value needs.
export const formatNumberInput = (
  value: number | null | undefined,
  locale: Locale,
  maximumFractionDigits = 4
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return ''
  }
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits
  }).format(value)
}
