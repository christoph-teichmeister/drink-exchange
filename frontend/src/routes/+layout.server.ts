import type { LayoutServerLoad } from './$types'
import { serverApi } from '$lib/server/api'
import type { AuthUser } from '$lib/types'

// Runs per request on the server; `handleFetch` forwards the session cookie to
// the internal API so a hard refresh keeps the user signed in.
export const load: LayoutServerLoad = async ({ fetch, locals }) => {
  let currentUser: AuthUser | null = null
  try {
    const response = await fetch(serverApi().auth.me())
    if (response.ok) {
      currentUser = (await response.json()) as AuthUser
    }
  } catch (error) {
    console.error('Auth check failed', error)
  }

  return {
    locale: locals.locale,
    currentUser
  }
}
