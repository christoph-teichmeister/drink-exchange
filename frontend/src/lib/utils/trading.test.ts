import { describe, expect, it, vi } from 'vitest'
import { recordTrade, TradeError } from '$lib/utils/trading'

const okBody = {
  trade: {
    id: 1,
    drink_id: 7,
    qty: 2,
    price: 5,
    occurred_at: '2026-09-23T10:00:00+00:00'
  },
  drinks: [{ id: '7', name: 'Lager', price: 5.5, base_price: 5 }]
}

describe('recordTrade', () => {
  it('posts JSON with credentials and returns the parsed body', async () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify(okBody), { status: 201 })
    )

    const result = await recordTrade(fetch, 'main stage', '7', 2)

    expect(result).toEqual(okBody)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/bars\/main%20stage\/trades\/$/)
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' })
    expect(JSON.parse(String(init.body))).toEqual({ drink_id: 7, qty: 2 })
  })

  it('raises TradeError with the backend detail on failure', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ detail: 'Choose a drink of this bar.' }),
          {
            status: 400
          }
        )
    )

    await expect(recordTrade(fetch, 'bar', 1, 1)).rejects.toMatchObject({
      status: 400,
      detail: 'Choose a drink of this bar.'
    })
  })

  it('raises TradeError(0) when the network fails', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('offline')
    })

    const error = await recordTrade(fetch, 'bar', 1, 1).catch((e) => e)
    expect(error).toBeInstanceOf(TradeError)
    expect(error.status).toBe(0)
  })
})
