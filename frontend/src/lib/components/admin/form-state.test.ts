import { describe, expect, it } from 'vitest'
import { describeFailure } from '$lib/components/admin/form-state'
import { getTranslations } from '$lib/i18n'
import { AdminApiError } from '$lib/utils/admin-api'

const t = getTranslations('de').admin

describe('describeFailure', () => {
  it('shows the translated backend detail with the field errors', () => {
    const error = new AdminApiError(
      400,
      'Bitte die markierten Felder korrigieren.',
      {
        base_price: [
          'Der Basispreis muss zwischen Mindest- und Höchstpreis liegen.'
        ]
      }
    )

    expect(describeFailure(error, t)).toEqual({
      errors: {
        base_price: [
          'Der Basispreis muss zwischen Mindest- und Höchstpreis liegen.'
        ]
      },
      feedback: {
        level: 'danger',
        text: 'Bitte die markierten Felder korrigieren.'
      }
    })
  })

  it('shows specific backend conflicts and permission errors', () => {
    const conflict = new AdminApiError(
      409,
      'Für dieses Getränk gibt es Buchungen.',
      {}
    )
    const forbidden = new AdminApiError(
      403,
      'Nur Manager der Bar können die Marktkonfiguration ändern.',
      {}
    )

    expect(describeFailure(conflict, t).feedback?.text).toBe(
      'Für dieses Getränk gibt es Buchungen.'
    )
    expect(describeFailure(forbidden, t).feedback?.text).toBe(
      'Nur Manager der Bar können die Marktkonfiguration ändern.'
    )
  })

  it('falls back to our own text without a backend detail', () => {
    expect(
      describeFailure(new AdminApiError(400, null, {}), t).feedback?.text
    ).toBe(t.feedback.invalid)
    expect(
      describeFailure(new AdminApiError(403, null, {}), t).feedback?.text
    ).toBe(t.feedback.forbidden)
    expect(
      describeFailure(new AdminApiError(500, null, {}), t).feedback?.text
    ).toBe(t.feedback.failed)
    expect(describeFailure(new Error('boom'), t).feedback?.text).toBe(
      t.feedback.failed
    )
  })

  it('keeps our own text for network and session problems', () => {
    expect(
      describeFailure(new AdminApiError(0, 'x', {}), t).feedback?.text
    ).toBe(t.feedback.network)
    expect(
      describeFailure(new AdminApiError(401, 'Anmeldung erforderlich.', {}), t)
        .feedback?.text
    ).toBe(t.feedback.session)
  })
})
