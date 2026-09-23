import type { Locale } from '$lib/i18n'

// All formatting follows the active UI locale instead of a fixed region.

export const formatCurrency = (
  value: number | null | undefined,
  locale: Locale,
  currency = 'EUR'
) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatDelta = (
  value: number | null | undefined,
  locale: Locale
) => {
  const delta = Number.isFinite(Number(value)) ? Number(value) : 0
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero'
  }).format(delta)
}

export const formatTime = (
  value: string | null | undefined,
  locale: Locale,
  withSeconds = false
): string | null => {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {})
  })
}

export const formatPercent = (
  value: number | null | undefined,
  locale: Locale
) => {
  const percent = Number.isFinite(Number(value)) ? Number(value) : 0
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero'
  }).format(percent / 100)
}

// Plain price without currency symbol for dense numeric columns.
export const formatPrice = (
  value: number | null | undefined,
  locale: Locale
) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
