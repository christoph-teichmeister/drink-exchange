import { writable } from 'svelte/store'
import { apiConfig } from '$lib/config'

export type AuthUser = {
  username: string
  email: string
  first_name: string
  last_name: string
}

export const currentUser = writable<AuthUser | null>(null)

const jsonHeaders = {
  'Content-Type': 'application/json'
}

export const fetchCurrentUser = async (fetch: typeof window.fetch) => {
  const response = await fetch(apiConfig.auth.me(), {
    credentials: 'include'
  })

  if (!response.ok) {
    currentUser.set(null)
    throw response
  }

  const payload: AuthUser = await response.json()
  currentUser.set(payload)
  return payload
}

export const loginUser = async (
  fetch: typeof window.fetch,
  credentials: { username: string; password: string }
) => {
  const response = await fetch(apiConfig.auth.login(), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(credentials)
  })

  if (!response.ok) {
    throw response
  }

  const payload: AuthUser = await response.json()
  currentUser.set(payload)
  return payload
}

export const logoutUser = async (fetch: typeof window.fetch) => {
  const response = await fetch(apiConfig.auth.logout(), {
    method: 'POST',
    credentials: 'include'
  })
  currentUser.set(null)
  return response
}
