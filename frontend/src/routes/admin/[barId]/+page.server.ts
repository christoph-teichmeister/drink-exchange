import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getTranslations } from '$lib/i18n'
import { fetchAssignedBar, fetchBackendJson, serverApi } from '$lib/server/api'
import type { BarSettings, DrinkConfig, EventConfig } from '$lib/types'
import { canManageBar } from '$lib/utils/roles'

export const load: PageServerLoad = async ({ fetch, locals, params }) => {
  const t = getTranslations(locals.locale)
  const bar = await fetchAssignedBar(fetch, t, params.barId)
  if (!canManageBar(bar.role)) {
    error(403, t.errors.managerRequired)
  }
  const api = serverApi()
  const [settings, drinks, events] = await Promise.all([
    fetchBackendJson<BarSettings>(
      fetch,
      api.barSettingsEndpoint(params.barId),
      t,
      t.errors.configUnavailable
    ),
    fetchBackendJson<{ drinks: DrinkConfig[] }>(
      fetch,
      api.barDrinksEndpoint(params.barId),
      t,
      t.errors.configUnavailable
    ),
    fetchBackendJson<{ events: EventConfig[] }>(
      fetch,
      api.barEventsEndpoint(params.barId),
      t,
      t.errors.configUnavailable
    )
  ])
  return { bar, settings, drinks: drinks.drinks, events: events.events }
}
