import type { Locale, Translation } from '$lib/i18n'
import { AdminApiError, type FieldErrors } from '$lib/utils/admin-api'
import { parseLocaleNumber } from '$lib/utils/locale-number'

export type NumberSpec = {
  field: string
  text: string
  optional?: boolean
  integer?: boolean
}

// Parses locale number inputs into an API payload. Collects a translated error
// per field instead of sending invalid numbers to the backend.
export const parseNumbers = (
  specs: NumberSpec[],
  locale: Locale,
  t: Translation['admin']
): { values: Record<string, number | null>; errors: FieldErrors } => {
  const values: Record<string, number | null> = {}
  const errors: FieldErrors = {}
  for (const spec of specs) {
    const parsed = parseLocaleNumber(spec.text, locale)
    if (parsed === null) {
      if (spec.optional) {
        values[spec.field] = null
      } else {
        errors[spec.field] = [t.validation.required]
      }
    } else if (Number.isNaN(parsed)) {
      errors[spec.field] = [t.validation.number]
    } else if (spec.integer && !Number.isInteger(parsed)) {
      errors[spec.field] = [t.validation.integer]
    } else {
      values[spec.field] = parsed
    }
  }
  return { values, errors }
}

export type SaveFeedback = { level: 'success' | 'danger'; text: string } | null

// Turns a failed request into field errors plus a translated summary message.
export const describeFailure = (
  error: unknown,
  t: Translation['admin']
): { errors: FieldErrors; feedback: SaveFeedback } => {
  if (!(error instanceof AdminApiError)) {
    return {
      errors: {},
      feedback: { level: 'danger', text: t.feedback.failed }
    }
  }
  const text =
    error.status === 0
      ? t.feedback.network
      : error.status === 401
        ? t.feedback.session
        : error.status === 403
          ? t.feedback.forbidden
          : error.status === 400
            ? t.feedback.invalid
            : (error.detail ?? t.feedback.failed)
  return { errors: error.errors, feedback: { level: 'danger', text } }
}
