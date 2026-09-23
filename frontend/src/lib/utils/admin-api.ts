export type FieldErrors = Record<string, string[]>

export class AdminApiError extends Error {
  readonly status: number
  readonly detail: string | null
  readonly errors: FieldErrors

  constructor(status: number, detail: string | null, errors: FieldErrors) {
    super(`Admin request failed with status ${status}`)
    this.name = 'AdminApiError'
    this.status = status
    this.detail = detail
    this.errors = errors
  }
}

const normalizeErrors = (value: unknown): FieldErrors => {
  if (!value || typeof value !== 'object') {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(
      ([field, messages]) => [
        field,
        Array.isArray(messages) ? messages.map(String) : [String(messages)]
      ]
    )
  )
}

// JSON request against the bar configuration API. Throws AdminApiError with
// the backend's `detail` and per-field `errors` (status 0 for network errors).
export const adminRequest = async <T>(
  fetch: typeof window.fetch,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown
): Promise<T> => {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new AdminApiError(0, null, {})
  }
  if (response.status === 204) {
    return undefined as T
  }
  const payload: Record<string, unknown> | null = await response
    .json()
    .catch(() => null)
  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      typeof payload?.detail === 'string' ? payload.detail : null,
      normalizeErrors(payload?.errors)
    )
  }
  return payload as T
}
