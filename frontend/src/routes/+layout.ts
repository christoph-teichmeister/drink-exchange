import type { LayoutLoad } from './$types'
import { apiConfig } from '$lib/config'
import { currentUser, type AuthUser } from '$lib/stores/auth'

export const load: LayoutLoad = async ({ fetch }) => {
  try {
    const response = await fetch(apiConfig.auth.me(), {
      credentials: 'include'
    })

    if (response.ok) {
      const payload: AuthUser = await response.json()
      currentUser.set(payload)
      return { currentUser: payload }
    }
  } catch (error) {
    console.error('Auth check failed', error)
  }

  currentUser.set(null)
  return {}
}
