import { apiConfig } from '$lib/config'
import type { AuthUser } from '$lib/types'

// The current user is not kept in a module-level store: it is loaded per
// request in `routes/+layout.server.ts` and read via `page.data.currentUser`.
// Callers re-run the loads (`invalidateAll`) after logging in or out.

const jsonHeaders = {
  'Content-Type': 'application/json'
}

export class LoginError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Login failed with status ${status}`)
    this.name = 'LoginError'
    this.status = status
  }
}

export const loginUser = async (
  fetch: typeof window.fetch,
  credentials: { username: string; password: string }
): Promise<AuthUser> => {
  const response = await fetch(apiConfig.auth.login(), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(credentials)
  })

  if (!response.ok) {
    throw new LoginError(response.status)
  }

  return (await response.json()) as AuthUser
}

export const logoutUser = (fetch: typeof window.fetch) =>
  fetch(apiConfig.auth.logout(), {
    method: 'POST',
    credentials: 'include'
  })
