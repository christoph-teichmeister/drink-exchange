import type { PageServerLoad } from './$types'
import { getTranslations } from '$lib/i18n'
import { fetchAssignedBar, fetchBackendJson, serverApi } from '$lib/server/api'
import type { BoardSnapshot } from '$lib/stores/board'

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const t = getTranslations(locals.locale)
  const [bar, snapshot] = await Promise.all([
    fetchAssignedBar(fetch, t, params.barId),
    fetchBackendJson<BoardSnapshot>(
      fetch,
      serverApi().barMarketEndpoint(params.barId),
      t,
      t.errors.snapshotUnavailable
    )
  ])
  return { bar, snapshot }
}
