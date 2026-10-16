import { describe, expect, it } from 'vitest'
import { activityPhrase, deltaLabel } from '../../src/features/dashboard/actions-labels'

describe('dashboard labels', () => {
  it('describes deltas against the previous period', () => {
    expect(deltaLabel(12, 10)).toBe('+20% dari periode sebelumnya')
    expect(deltaLabel(5, 10)).toBe('-50% dari periode sebelumnya')
    expect(deltaLabel(0, 0)).toBe('Sama dengan periode sebelumnya')
    expect(deltaLabel(3, 0)).toBe('Naik dari 0')
  })
  it('phrases audit entries in Indonesian', () => {
    expect(activityPhrase('publish', 'posts')).toBe('menerbitkan artikel')
  })
})
