import type { PageServerLoad } from './$types'
import { getTranslations } from '$lib/i18n'
import { fetchBackendJson, serverApi } from '$lib/server/api'
import type { BoardSnapshot } from '$lib/stores/board'

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const t = getTranslations(locals.locale)
  const snapshot = await fetchBackendJson<BoardSnapshot>(
    fetch,
    serverApi().barMarketEndpoint(params.barId),
    t,
    t.errors.snapshotUnavailable
  )
  return { snapshot }
}
