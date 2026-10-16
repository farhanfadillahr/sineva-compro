import { describe, expect, it } from 'vitest'
import { createReplayThrottle } from '../../src/components/brand/replay-throttle'

describe('createReplayThrottle', () => {
  it('allows the first replay and blocks the next ones inside the window', () => {
    let now = 1_000
    const take = createReplayThrottle(10_000, () => now)
    expect(take()).toBe(true)
    now += 9_999
    expect(take()).toBe(false)
  })

  it('allows a replay again once the window has passed', () => {
    let now = 1_000
    const take = createReplayThrottle(10_000, () => now)
    expect(take()).toBe(true)
    now += 10_000
    expect(take()).toBe(true)
  })

  it('does not extend the window when a call is refused', () => {
    let now = 0
    const take = createReplayThrottle(10_000, () => now)
    take()
    now = 6_000
    expect(take()).toBe(false)
    now = 10_000
    expect(take()).toBe(true)
  })
})
