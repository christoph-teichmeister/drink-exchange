import { describe, expect, it, vi } from 'vitest'
import { AdminApiError, adminRequest } from '$lib/utils/admin-api'

const respond = (status: number, body?: unknown) =>
  vi.fn(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status
      })
  )

describe('adminRequest', () => {
  it('sends JSON with credentials and returns the body', async () => {
    const fetch = respond(200, { name: 'Bar' })
    await expect(
      adminRequest(fetch, 'PATCH', '/api/x/', { name: 'Bar' })
    ).resolves.toEqual({ name: 'Bar' })
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(init).toMatchObject({ method: 'PATCH', credentials: 'include' })
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('resolves 204 responses without a body', async () => {
    await expect(
      adminRequest(respond(204), 'DELETE', '/api/x/1/')
    ).resolves.toBeUndefined()
  })

  it('maps field errors and detail', async () => {
    const fetch = respond(400, {
      detail: 'Please correct the highlighted fields.',
      errors: { base_price: ['Too high.'], non_field: 'Broken' }
    })
    const error = (await adminRequest(fetch, 'POST', '/api/x/', {}).catch(
      (e: unknown) => e
    )) as AdminApiError
    expect(error).toBeInstanceOf(AdminApiError)
    expect(error.status).toBe(400)
    expect(error.errors).toEqual({
      base_price: ['Too high.'],
      non_field: ['Broken']
    })
  })

  it('reports network failures as status 0', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('offline')
    })
    await expect(adminRequest(fetch, 'GET', '/api/x/')).rejects.toMatchObject({
      status: 0
    })
  })
})
