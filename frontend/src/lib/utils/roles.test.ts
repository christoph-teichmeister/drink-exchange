import { describe, expect, it } from 'vitest'
import { canManageBar } from '$lib/utils/roles'

describe('canManageBar', () => {
  it('allows managers only', () => {
    expect(canManageBar('manager')).toBe(true)
    expect(canManageBar('operator')).toBe(false)
    expect(canManageBar(undefined)).toBe(false)
    expect(canManageBar(null)).toBe(false)
  })
})
