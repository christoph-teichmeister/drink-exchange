import { error, redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { apiConfig } from '$lib/config'

type BarSummary = {
  slug: string
  name: string
  description: string
}

export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch(apiConfig.barsEndpoint(), {
    credentials: 'include'
  })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw redirect(303, '/login?from=protected')
    }
    throw error(response.status, 'Unable to load assigned bars')
  }

  const payload: { bars: BarSummary[] } = await response.json()
  const bar = payload.bars?.find((candidate) => candidate.slug === params.barId)
  if (!bar) {
    throw error(404, 'Bar not found or not assigned')
  }

  return { bar }
}
