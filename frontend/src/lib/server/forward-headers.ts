import { isInternalApiRequest } from '$lib/server/api'

const FORWARDED_HEADERS = ['cookie', 'accept-language'] as const

// SvelteKit only forwards cookies to the app's own origin. The backend is a
// different host during SSR (e.g. http://backend:8000), so copy the user's
// session and language explicitly, and only for the internal API.
export const forwardUserHeaders = (incoming: Request, outgoing: Request) => {
  if (!isInternalApiRequest(outgoing.url)) {
    return outgoing
  }
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.headers.get(name)
    if (value) {
      outgoing.headers.set(name, value)
    }
  }
  return outgoing
}
