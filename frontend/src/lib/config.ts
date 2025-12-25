const apiBase = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '');
const wsBase = (import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000').replace(/\/+$/, '');

export const apiConfig = {
  baseUrl: apiBase,
  marketEndpoint: () => `${apiBase}/market/`
};

export const wsConfig = {
  baseUrl: wsBase,
  marketWebSocketUrl: (barId: string) => `${wsBase}/ws/market/${barId}/`
};
