import { describe, expect, it, vi } from 'vitest'
import { forwardUserHeaders } from '$lib/server/forward-headers'

vi.mock('$env/dynamic/private', () => ({
  env: { VITE_API_INTERNAL_BASE_URL: 'http://backend:8000/api' }
}))

const incoming = () =>
  new Request('http://localhost:5173/board', {
    headers: { cookie: 'sessionid=abc', 'accept-language': 'de-DE' }
  })

describe('forwardUserHeaders', () => {
  it('forwards session cookie and language to the internal API', () => {
    const request = forwardUserHeaders(
      incoming(),
      new Request('http://backend:8000/api/auth/me/')
    )
    expect(request.headers.get('cookie')).toBe('sessionid=abc')
    expect(request.headers.get('accept-language')).toBe('de-DE')
  })

  it('never leaks cookies to other hosts or paths', () => {
    for (const url of [
      'https://example.com/api/auth/me/',
      'http://backend:8000/admin/'
    ]) {
      const request = forwardUserHeaders(incoming(), new Request(url))
      expect(request.headers.get('cookie')).toBeNull()
    }
  })
})
