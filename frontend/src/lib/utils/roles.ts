import type { BarRole } from '$lib/types'

// Only managers may open the admin area; operators use desk and board.
export const canManageBar = (role: BarRole | null | undefined) =>
  role === 'manager'
