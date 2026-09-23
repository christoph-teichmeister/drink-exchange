import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, url }) => {
  if (url.searchParams.has('from')) {
    return
  }

  const { currentUser } = await parent()
  if (currentUser) {
    redirect(303, '/board')
  }
}
