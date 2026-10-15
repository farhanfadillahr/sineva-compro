export type LockoutState = { failedAttempts: number; lockedUntil: Date | null }

export function evaluateLockout(state: LockoutState, now: Date) {
  if (state.lockedUntil && state.lockedUntil <= now)
    return { locked: false, state: { failedAttempts: 0, lockedUntil: null } as LockoutState }
  return { locked: state.lockedUntil !== null, state }
}

export function applyLoginOutcome(
  state: LockoutState,
  outcome: 'failure' | 'success',
  now: Date,
): LockoutState {
  const evaluated = evaluateLockout(state, now)
  if (evaluated.locked) return evaluated.state
  if (outcome === 'success') return { failedAttempts: 0, lockedUntil: null }
  const failedAttempts = Math.min(5, evaluated.state.failedAttempts + 1)
  return {
    failedAttempts,
    lockedUntil: failedAttempts === 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null,
  }
}
