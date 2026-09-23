import type { PageServerLoad } from './$types'
import { getTranslations } from '$lib/i18n'
import { fetchAssignedBar } from '$lib/server/api'

export const load: PageServerLoad = async ({ fetch, locals, params }) => ({
  bar: await fetchAssignedBar(
    fetch,
    getTranslations(locals.locale),
    params.barId
  )
})
