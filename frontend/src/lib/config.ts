const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const publicApiBase = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
)
const internalApiBase = trimTrailingSlash(
  import.meta.env.VITE_API_INTERNAL_BASE_URL ?? publicApiBase
)
const apiBase = import.meta.env.SSR ? internalApiBase : publicApiBase
const wsBase = trimTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000'
)

export const apiConfig = {
  baseUrl: apiBase,
  marketEndpoint: () => `${apiBase}/market/`,
  barsEndpoint: () => `${apiBase}/bars/`,
  barMarketEndpoint: (barId: string) => `${apiBase}/bars/${barId}/market/`,
  localeEndpoint: () => `${apiBase}/locale/`,
  auth: {
    login: () => `${apiBase}/auth/login/`,
    logout: () => `${apiBase}/auth/logout/`,
    me: () => `${apiBase}/auth/me/`
  }
}

export const wsConfig = {
  baseUrl: wsBase,
  marketWebSocketUrl: (barId: string) => `${wsBase}/ws/market/${barId}/`
}
