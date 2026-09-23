import { env } from '$env/dynamic/private'
import { error, redirect, type NumericRange } from '@sveltejs/kit'
import {
  buildApiEndpoints,
  publicApiBase,
  trimTrailingSlash
} from '$lib/config'
import type { Translation } from '$lib/i18n'
import type { BarSummary } from '$lib/types'

// Resolved at runtime so a Docker image can point at a different backend
// without being rebuilt; falls back to the build-time Vite value.
export const internalApiBase = () =>
  trimTrailingSlash(
    env.VITE_API_INTERNAL_BASE_URL ||
      import.meta.env.VITE_API_INTERNAL_BASE_URL ||
      publicApiBase
  )

export const serverApi = () => buildApiEndpoints(internalApiBase())

// True when a server-side fetch targets our own backend API, i.e. when the
// incoming request's cookies may be forwarded to it.
export const isInternalApiRequest = (url: string) => {
  const target = new URL(url)
  const base = new URL(`${internalApiBase()}/`)
  return (
    target.origin === base.origin && target.pathname.startsWith(base.pathname)
  )
}

const toErrorStatus = (status: number): NumericRange<400, 599> =>
  (status >= 400 && status <= 599 ? status : 502) as NumericRange<400, 599>

type ServerFetch = typeof fetch

// Fetches a backend endpoint on behalf of the current user. Redirects to the
// login page when the session is missing and raises translated HTTP errors.
export const fetchBackendJson = async <T>(
  fetch: ServerFetch,
  url: string,
  t: Translation,
  failureMessage: string
): Promise<T> => {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    error(503, t.errors.backendUnreachable)
  }

  if (response.status === 401) {
    redirect(303, '/login?from=protected')
  }
  if (response.status === 404) {
    error(404, t.errors.barNotFound)
  }
  if (response.status === 403) {
    error(403, t.errors.barNotFound)
  }
  if (!response.ok) {
    error(toErrorStatus(response.status), failureMessage)
  }

  return (await response.json()) as T
}

export const fetchAssignedBars = async (
  fetch: ServerFetch,
  t: Translation
): Promise<BarSummary[]> => {
  const payload = await fetchBackendJson<{ bars?: BarSummary[] }>(
    fetch,
    serverApi().barsEndpoint(),
    t,
    t.errors.barsUnavailable
  )
  return payload.bars ?? []
}

export const fetchAssignedBar = async (
  fetch: ServerFetch,
  t: Translation,
  slug: string
): Promise<BarSummary> => {
  const bars = await fetchAssignedBars(fetch, t)
  const bar = bars.find((candidate) => candidate.slug === slug)
  if (!bar) {
    error(404, t.errors.barNotFound)
  }
  return bar
}
