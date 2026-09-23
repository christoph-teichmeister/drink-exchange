import type { Handle, HandleFetch } from '@sveltejs/kit'
import {
  fallbackLocale,
  languageCookieName,
  matchSupportedLocale,
  parseAcceptLanguage
} from '$lib/i18n'
import { forwardUserHeaders } from '$lib/server/forward-headers'

export const handle: Handle = async ({ event, resolve }) => {
  const locale =
    matchSupportedLocale(event.cookies.get(languageCookieName)) ??
    parseAcceptLanguage(event.request.headers.get('accept-language')) ??
    fallbackLocale
  event.locals.locale = locale

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', locale)
  })
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) =>
  fetch(forwardUserHeaders(event.request, request))
