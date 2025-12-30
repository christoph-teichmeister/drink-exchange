import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { apiConfig } from '$lib/config'

type BarSummary = {
  slug: string
  name: string
  description: string
}

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch(apiConfig.barsEndpoint(), {
    credentials: 'include'
  })
  if (!response.ok) {
    throw error(response.status, 'Unable to load configured bars')
  }

  const payload: { bars: BarSummary[] } = await response.json()
  return { bars: payload.bars ?? [] }
}
