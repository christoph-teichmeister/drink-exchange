import type { PageServerLoad } from './$types'
import { getTranslations } from '$lib/i18n'
import { fetchAssignedBars } from '$lib/server/api'

export const load: PageServerLoad = async ({ fetch, locals }) => ({
  bars: await fetchAssignedBars(fetch, getTranslations(locals.locale))
})
