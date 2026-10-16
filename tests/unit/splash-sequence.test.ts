import { describe, expect, it } from 'vitest'
import {
  initialSplashState,
  msUntil,
  nextSplashState,
  planLiftWipe,
  planRestWipe,
  SPLASH_CLIP,
  SPLASH_TIMING,
  wipeClipPath,
  wipeProgressAt,
  type SplashEvent,
  type SplashState,
} from '../../src/components/brand/splash-sequence'

// The pure half of the splash (docs/design/motion.md section 3.1): every number the sequence
// depends on and every transition of its state machine, with no DOM and no timers.

describe('SPLASH_CLIP, measured from public/mascot/launch/sino-launch', () => {
  it('describes a 28 frame, 24 fps clip', () => {
    expect(SPLASH_CLIP.durationMs).toBe(1167)
  })

  it('lifts off before it exits, and exits before the clip ends', () => {
    expect(SPLASH_CLIP.liftMs).toBeGreaterThan(0)
    expect(SPLASH_CLIP.liftMs).toBeLessThan(SPLASH_CLIP.exitMs)
    expect(SPLASH_CLIP.exitMs).toBeLessThanOrEqual(SPLASH_CLIP.durationMs)
  })

  it('lifts at 460 ms, where her feet leave the ground, and has left the top by 900 ms', () => {
    expect(SPLASH_CLIP.liftMs).toBe(460)
    expect(SPLASH_CLIP.exitMs).toBe(900)
  })
})

describe('SPLASH_TIMING, the owner safety rules', () => {
  it('gives up on a clip that has not started 2.5 s after navigation start', () => {
    expect(SPLASH_TIMING.noVideoDeadlineMs).toBe(2500)
  })

  it('wipes without Sino in 400 ms', () => {
    expect(SPLASH_TIMING.fallbackWipeMs).toBe(400)
  })

  it('removes the overlay at an absolute 5 s', () => {
    expect(SPLASH_TIMING.hardStopMs).toBe(5000)
  })

  it('keeps the skip wipe fast and the stall watchdog shorter than the no-video deadline', () => {
    expect(SPLASH_TIMING.skipWipeMs).toBeLessThanOrEqual(250)
    expect(SPLASH_TIMING.stallMs).toBeLessThan(SPLASH_TIMING.noVideoDeadlineMs)
  })

  it('leaves room for the whole sequence before the hard stop: the late start rule still fits', () => {
    expect(SPLASH_TIMING.noVideoDeadlineMs + SPLASH_CLIP.exitMs).toBeLessThan(
      SPLASH_TIMING.hardStopMs,
    )
  })
})

describe('wipeClipPath', () => {
  it('fully covers the viewport at progress 0, curve parked below the bottom edge', () => {
    // bottom inset = -bulge: the curved edge starts off screen, so no corner of the page shows
    expect(wipeClipPath(0)).toBe(
      'inset(0px 0px calc(0% - 10svh) 0px round 0px 0px 50% 50% / 0px 0px 10svh 10svh)',
    )
  })

  it('removes everything at progress 1', () => {
    expect(wipeClipPath(1)).toBe(
      'inset(0px 0px calc(100% - 0svh) 0px round 0px 0px 50% 50% / 0px 0px 0svh 0svh)',
    )
  })

  it('keeps one function shape for every progress, so the browser can interpolate between any two', () => {
    const shape = (p: number) => wipeClipPath(p).replace(/-?\d+(\.\d+)?/g, '#')
    expect(shape(0.25)).toBe(shape(0))
    expect(shape(0.9)).toBe(shape(1))
  })

  it('clamps out-of-range progress', () => {
    expect(wipeClipPath(-1)).toBe(wipeClipPath(0))
    expect(wipeClipPath(2)).toBe(wipeClipPath(1))
  })

  it('shrinks the bulge as the edge rises, so it never outlives the wipe', () => {
    expect(wipeClipPath(0.5)).toContain('calc(50% - 5svh)')
  })
})

describe('planLiftWipe: derive the wipe from the clip position', () => {
  const window = SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs

  it('runs the whole wipe from the lift moment when the clip is at or before it', () => {
    expect(planLiftWipe(0)).toEqual({ fromProgress: 0, durationMs: window })
    expect(planLiftWipe(SPLASH_CLIP.liftMs)).toEqual({ fromProgress: 0, durationMs: window })
  })

  it('catches up when the clip is already past the lift (late poll), finishing with the clip', () => {
    const plan = planLiftWipe(SPLASH_CLIP.liftMs + 110)
    expect(plan.fromProgress).toBeCloseTo(110 / window, 5)
    expect(plan.durationMs).toBe(window - 110)
  })

  it('ends exactly where she exits the top: position + duration = exit, from the lift on', () => {
    for (const t of [460, 500, 700, 899]) {
      expect(t + planLiftWipe(t).durationMs).toBe(SPLASH_CLIP.exitMs)
    }
  })

  it('is instant when the clip is already past her exit', () => {
    expect(planLiftWipe(SPLASH_CLIP.exitMs)).toEqual({ fromProgress: 1, durationMs: 0 })
    expect(planLiftWipe(SPLASH_CLIP.durationMs)).toEqual({ fromProgress: 1, durationMs: 0 })
  })
})

describe('planRestWipe and wipeProgressAt', () => {
  it('finishes the rest of a wipe in the same fraction of the target time', () => {
    expect(planRestWipe(0, 220)).toEqual({ fromProgress: 0, durationMs: 220 })
    expect(planRestWipe(0.75, 220)).toEqual({ fromProgress: 0.75, durationMs: 55 })
    expect(planRestWipe(1, 220)).toEqual({ fromProgress: 1, durationMs: 0 })
  })

  it('reads progress back from elapsed time on a linear wipe', () => {
    expect(wipeProgressAt(0, 0, 440)).toBe(0)
    expect(wipeProgressAt(220, 0, 440)).toBe(0.5)
    expect(wipeProgressAt(110, 0.5, 220)).toBe(0.75)
    expect(wipeProgressAt(9999, 0.2, 100)).toBe(1)
    expect(wipeProgressAt(10, 0.3, 0)).toBe(1)
  })
})

describe('msUntil', () => {
  it('is the time left to a deadline on the navigation-start clock, never negative', () => {
    expect(msUntil(2500, 600)).toBe(1900)
    expect(msUntil(2500, 2500)).toBe(0)
    expect(msUntil(2500, 9000)).toBe(0)
  })
})

describe('nextSplashState: the sequence state machine', () => {
  const at = (state: SplashState, ...events: SplashEvent[]) => events.reduce(nextSplashState, state)

  it('starts covering, waiting for the clip', () => {
    expect(initialSplashState).toEqual({ phase: 'cover', wipe: null })
  })

  it('cover -> launch when the clip starts playing: still fully covering, no wipe yet', () => {
    expect(at(initialSplashState, { type: 'clipPlaying' })).toEqual({ phase: 'launch', wipe: null })
  })

  it('launch -> wipe(lift) when the clip reaches the lift moment', () => {
    expect(at(initialSplashState, { type: 'clipPlaying' }, { type: 'clipLift' })).toEqual({
      phase: 'wipe',
      wipe: 'lift',
    })
  })

  it('never wipes on the lift event before the clip is playing', () => {
    expect(at(initialSplashState, { type: 'clipLift' })).toEqual(initialSplashState)
  })

  it('wipe -> done when the wipe completes', () => {
    expect(
      at(initialSplashState, { type: 'clipPlaying' }, { type: 'clipLift' }, { type: 'wipeDone' }),
    ).toEqual({ phase: 'done', wipe: null })
  })

  it('does not finish on wipeDone while only covering: the page waits for the animation', () => {
    expect(at(initialSplashState, { type: 'wipeDone' }).phase).toBe('cover')
    expect(at(initialSplashState, { type: 'clipPlaying' }, { type: 'wipeDone' }).phase).toBe(
      'launch',
    )
  })

  it('does not finish when the clip ends before the wipe does', () => {
    const state = at(
      initialSplashState,
      { type: 'clipPlaying' },
      { type: 'clipLift' },
      { type: 'clipEnded' },
    )
    expect(state).toEqual({ phase: 'wipe', wipe: 'lift' })
  })

  describe('no clip within 2.5 s', () => {
    it('cover -> wipe(fallback), the 400 ms wipe without Sino', () => {
      expect(at(initialSplashState, { type: 'noClipDeadline' })).toEqual({
        phase: 'wipe',
        wipe: 'fallback',
      })
    })

    it('is ignored once the clip is playing: the deadline is about starting, not finishing', () => {
      const playing = at(initialSplashState, { type: 'clipPlaying' })
      expect(at(playing, { type: 'noClipDeadline' })).toEqual(playing)
    })
  })

  describe('clip errors or stalls', () => {
    it('wipes at once while covering (fast wipe)', () => {
      expect(at(initialSplashState, { type: 'clipFailed' })).toEqual({
        phase: 'wipe',
        wipe: 'fast',
      })
    })

    it('wipes at once while waiting at the stand', () => {
      expect(at(initialSplashState, { type: 'clipPlaying' }, { type: 'clipFailed' })).toEqual({
        phase: 'wipe',
        wipe: 'fast',
      })
    })

    it('speeds up a lift wipe that is already running', () => {
      expect(
        at(
          initialSplashState,
          { type: 'clipPlaying' },
          { type: 'clipLift' },
          { type: 'clipFailed' },
        ),
      ).toEqual({ phase: 'wipe', wipe: 'fast' })
    })

    it('treats a clip that ends before the lift moment as a failure', () => {
      expect(at(initialSplashState, { type: 'clipPlaying' }, { type: 'clipEnded' })).toEqual({
        phase: 'wipe',
        wipe: 'fast',
      })
    })
  })

  describe('skip (key, click, scroll)', () => {
    it.each(['cover', 'launch'] as const)('from %s: a fast wipe', (phase) => {
      const state: SplashState = { phase, wipe: null }
      expect(at(state, { type: 'skip' })).toEqual({ phase: 'wipe', wipe: 'fast' })
    })

    it.each(['lift', 'fallback'] as const)('speeds up a running %s wipe', (wipe) => {
      expect(at({ phase: 'wipe', wipe }, { type: 'skip' })).toEqual({ phase: 'wipe', wipe: 'fast' })
    })

    it('then ends with the fast wipe', () => {
      expect(at(initialSplashState, { type: 'skip' }, { type: 'wipeDone' }).phase).toBe('done')
    })
  })

  describe('hard stop', () => {
    it.each([
      initialSplashState,
      { phase: 'launch', wipe: null },
      { phase: 'wipe', wipe: 'lift' },
      { phase: 'wipe', wipe: 'fallback' },
      { phase: 'wipe', wipe: 'fast' },
    ] as SplashState[])('ends from %j', (state) => {
      expect(at(state, { type: 'hardStop' })).toEqual({ phase: 'done', wipe: null })
    })
  })

  it('done is final: nothing restarts it', () => {
    const done: SplashState = { phase: 'done', wipe: null }
    for (const type of [
      'clipPlaying',
      'clipLift',
      'clipEnded',
      'clipFailed',
      'noClipDeadline',
      'skip',
      'wipeDone',
      'hardStop',
    ] as const) {
      expect(at(done, { type })).toEqual(done)
    }
  })

  it('ignores a late clip event once a wipe has started for another reason', () => {
    const fallback = at(initialSplashState, { type: 'noClipDeadline' })
    expect(at(fallback, { type: 'clipPlaying' })).toEqual(fallback)
    expect(at(fallback, { type: 'clipLift' })).toEqual(fallback)
  })
})
