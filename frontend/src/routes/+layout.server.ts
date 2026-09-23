import type { LayoutServerLoad } from './$types'
import {
  fallbackLocale,
  languageCookieName,
  matchSupportedLocale,
  Locale
} from '$lib/i18n'

const parseAcceptLanguage = (value?: string): Locale | undefined => {
  if (!value) {
    return undefined
  }

  const fragments = value.split(',').map((fragment) => fragment.trim())
  for (const fragment of fragments) {
    const [langPart] = fragment.split(';')
    const candidate = matchSupportedLocale(langPart.trim())
    if (candidate) {
      return candidate
    }
  }

  return undefined
}

export const load: LayoutServerLoad = async ({ cookies, request }) => {
  const cookieLocale = matchSupportedLocale(cookies.get(languageCookieName))
  const headerLocale = parseAcceptLanguage(
    request.headers.get('accept-language')
  )
  return {
    preferredLocale: cookieLocale ?? headerLocale ?? fallbackLocale
  }
}
