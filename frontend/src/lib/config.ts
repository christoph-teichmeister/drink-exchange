export const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const publicApiBase = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
)

const wsBase = trimTrailingSlash(
  import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
)

export const buildApiEndpoints = (apiBase: string) => ({
  baseUrl: apiBase,
  barsEndpoint: () => `${apiBase}/bars/`,
  barMarketEndpoint: (barId: string) =>
    `${apiBase}/bars/${encodeURIComponent(barId)}/market/`,
  localeEndpoint: () => `${apiBase}/locale/`,
  auth: {
    login: () => `${apiBase}/auth/login/`,
    logout: () => `${apiBase}/auth/logout/`,
    me: () => `${apiBase}/auth/me/`
  }
})

// Endpoints as reachable from the browser. Server-side code must use
// `$lib/server/api` instead, which targets the internal API base URL.
export const apiConfig = buildApiEndpoints(publicApiBase)

export const wsConfig = {
  baseUrl: wsBase,
  marketWebSocketUrl: (barId: string) =>
    `${wsBase}/ws/market/${encodeURIComponent(barId)}/`
}
