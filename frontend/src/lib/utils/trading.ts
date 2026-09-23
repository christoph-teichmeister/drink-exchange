import { apiConfig } from '$lib/config'

export type TradeResponse = {
  trade: {
    id: number
    drink_id: number
    qty: number
    price: number
    occurred_at: string
  }
  drinks: { id: string; name: string; price: number; base_price: number }[]
}

export class TradeError extends Error {
  readonly status: number
  readonly detail: string | null

  constructor(status: number, detail: string | null) {
    super(`Trade failed with status ${status}`)
    this.name = 'TradeError'
    this.status = status
    this.detail = detail
  }
}

// Records a purchase via `POST /api/bars/<slug>/trades/`. The backend applies
// the price impulse and broadcasts the new prices; the response carries them
// too, so the desk can update without waiting for the WebSocket frame.
export const recordTrade = async (
  fetch: typeof window.fetch,
  barSlug: string,
  drinkId: string | number,
  qty: number
): Promise<TradeResponse> => {
  let response: Response
  try {
    response = await fetch(apiConfig.barTradesEndpoint(barSlug), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drink_id: Number(drinkId), qty })
    })
  } catch {
    throw new TradeError(0, null)
  }
  if (!response.ok) {
    const payload: { detail?: unknown } | null = await response
      .json()
      .catch(() => null)
    throw new TradeError(
      response.status,
      typeof payload?.detail === 'string' ? payload.detail : null
    )
  }
  return (await response.json()) as TradeResponse
}
