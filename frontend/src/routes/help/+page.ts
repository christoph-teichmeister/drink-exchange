import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { apiConfig } from '$lib/config'

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch(apiConfig.auth.me(), {
    credentials: 'include'
  })

  if (!response.ok) {
    throw redirect(303, '/login?from=protected')
  }
}
