import { expect, it } from 'vitest'
import { applyLoginOutcome, evaluateLockout } from '../../src/features/auth/lockout-policy'

it('locks the fifth failure and never extends an active lock', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  const fifth = applyLoginOutcome({ failedAttempts: 4, lockedUntil: null }, 'failure', now)
  expect(fifth).toEqual({ failedAttempts: 5, lockedUntil: new Date('2026-10-15T00:15:00Z') })
  expect(applyLoginOutcome(fifth, 'failure', new Date('2026-10-15T00:01:00Z'))).toEqual(fifth)
  expect(evaluateLockout(fifth, new Date('2026-10-15T00:15:00Z'))).toEqual({
    locked: false,
    state: { failedAttempts: 0, lockedUntil: null },
  })
})

it('clears failures on success but cannot clear an active lock', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  expect(applyLoginOutcome({ failedAttempts: 3, lockedUntil: null }, 'success', now)).toEqual({
    failedAttempts: 0,
    lockedUntil: null,
  })
  const locked = { failedAttempts: 5, lockedUntil: new Date('2026-10-15T00:15:00Z') }
  expect(applyLoginOutcome(locked, 'success', now)).toEqual(locked)
})

it('counts a new cycle after expiry and keeps the first four failures unlocked', () => {
  let state = { failedAttempts: 0, lockedUntil: null } as ReturnType<typeof applyLoginOutcome>
  const now = new Date('2026-10-15T00:00:00Z')
  for (let i = 1; i <= 4; i++) {
    state = applyLoginOutcome(state, 'failure', now)
    expect(state).toEqual({ failedAttempts: i, lockedUntil: null })
  }
  expect(applyLoginOutcome({ failedAttempts: 5, lockedUntil: now }, 'failure', now)).toEqual({
    failedAttempts: 1,
    lockedUntil: null,
  })
})
