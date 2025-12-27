import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { apiConfig } from '$lib/config'
import type { BoardSnapshot } from '$lib/stores/board'

export const load: PageLoad = async ({ params, fetch }) => {
  const response = await fetch(apiConfig.barMarketEndpoint(params.barId))
  if (!response.ok) {
    throw error(response.status, 'Unable to load market snapshot')
  }

  const snapshot: BoardSnapshot = await response.json()
  return { snapshot }
}
