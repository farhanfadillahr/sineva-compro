import { describe, expect, it } from 'vitest'
import {
  LOOK_LIMITS,
  classifyFps,
  clamp,
  createFpsProbe,
  dampFactor,
  headFollowAngles,
  heroScrollProgress,
  isScrollSpike,
  parallaxOffsetPx,
  reactionEnvelope,
  swayAngle,
} from '@/components/mascot/sino-math'

const deg = (rad: number) => (rad * 180) / Math.PI
const rad = (degrees: number) => (degrees * Math.PI) / 180

describe('clamp', () => {
  it('limits to the range', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.4, 0, 1)).toBe(0.4)
  })
})

describe('dampFactor (frame-rate independent lerp)', () => {
  it('is exactly the 0.08 lerp at 60 fps', () => {
    expect(dampFactor(0.08, 1 / 60)).toBeCloseTo(0.08, 10)
  })

  it('converges to the same point in the same wall time at 30 and 120 fps', () => {
    const run = (fps: number) => {
      let value = 0
      for (let i = 0; i < fps; i += 1) value += (1 - value) * dampFactor(0.08, 1 / fps)
      return value
    }
    expect(run(30)).toBeCloseTo(run(120), 6)
  })

  it('never overshoots: a long frame gives a factor below 1', () => {
    expect(dampFactor(0.08, 10)).toBeLessThan(1)
    expect(dampFactor(0.08, 0)).toBe(0)
  })
})

describe('headFollowAngles (look-at limits)', () => {
  it('exposes the spec limits: yaw 25, pitch 15, eyes 0.6', () => {
    expect(deg(LOOK_LIMITS.yawRad)).toBeCloseTo(25, 10)
    expect(deg(LOOK_LIMITS.pitchRad)).toBeCloseTo(15, 10)
    expect(LOOK_LIMITS.eyeRatio).toBe(0.6)
  })

  it('passes a small angle through to the head and gives the eyes 0.6 of it on top', () => {
    const { head, eyes } = headFollowAngles({ yaw: rad(10), pitch: rad(5) }, 1)
    expect(deg(head.yaw)).toBeCloseTo(10, 6)
    expect(deg(head.pitch)).toBeCloseTo(5, 6)
    expect(deg(eyes.yaw)).toBeCloseTo(6, 6)
    expect(deg(eyes.pitch)).toBeCloseTo(3, 6)
  })

  it('clamps the head to +-25 yaw and +-15 pitch in both directions', () => {
    const a = headFollowAngles({ yaw: rad(80), pitch: rad(60) }, 1)
    expect(deg(a.head.yaw)).toBeCloseTo(25, 6)
    expect(deg(a.head.pitch)).toBeCloseTo(15, 6)
    const b = headFollowAngles({ yaw: rad(-80), pitch: rad(-60) }, 1)
    expect(deg(b.head.yaw)).toBeCloseTo(-25, 6)
    expect(deg(b.head.pitch)).toBeCloseTo(-15, 6)
  })

  it('scales everything by the look weight, so weight 0 is the front pose', () => {
    const { head, eyes } = headFollowAngles({ yaw: rad(20), pitch: rad(10) }, 0)
    expect(head).toEqual({ yaw: 0, pitch: 0 })
    expect(eyes).toEqual({ yaw: 0, pitch: 0 })
    const half = headFollowAngles({ yaw: rad(20), pitch: rad(10) }, 0.5)
    expect(deg(half.head.yaw)).toBeCloseTo(10, 6)
  })
})

describe('heroScrollProgress', () => {
  it('is 0 at the top, 1 once the hero has scrolled its own height, and clamped outside', () => {
    expect(heroScrollProgress(0, 0, 800)).toBe(0)
    expect(heroScrollProgress(400, 0, 800)).toBe(0.5)
    expect(heroScrollProgress(800, 0, 800)).toBe(1)
    expect(heroScrollProgress(5_000, 0, 800)).toBe(1)
    expect(heroScrollProgress(-50, 0, 800)).toBe(0)
  })

  it('accounts for the hero sitting below the top of the page', () => {
    expect(heroScrollProgress(100, 100, 400)).toBe(0)
    expect(heroScrollProgress(300, 100, 400)).toBe(0.5)
  })

  it('does not divide by zero for a collapsed hero', () => {
    expect(heroScrollProgress(100, 0, 0)).toBe(1)
  })
})

describe('parallaxOffsetPx (0.85x parallax)', () => {
  it('moves the rig down by the 15% the canvas should lag behind the page', () => {
    expect(parallaxOffsetPx(0)).toBe(0)
    expect(parallaxOffsetPx(400)).toBeCloseTo(60, 10)
  })

  it('never goes negative when scroll restoration reports a negative offset', () => {
    expect(parallaxOffsetPx(-30)).toBe(0)
  })
})

describe('isScrollSpike', () => {
  it('flags a fast flick and not a normal scroll', () => {
    expect(isScrollSpike(900)).toBe(false)
    expect(isScrollSpike(2_900)).toBe(false)
    expect(isScrollSpike(3_000)).toBe(true)
    expect(isScrollSpike(-6_000)).toBe(true)
  })
})

describe('reactionEnvelope and swayAngle', () => {
  it('rises 0 to 1 to 0 across its duration and is 0 outside it', () => {
    expect(reactionEnvelope(-0.1, 0.8)).toBe(0)
    expect(reactionEnvelope(0, 0.8)).toBe(0)
    expect(reactionEnvelope(0.4, 0.8)).toBeCloseTo(1, 10)
    expect(reactionEnvelope(0.8, 0.8)).toBeCloseTo(0, 10)
    expect(reactionEnvelope(2, 0.8)).toBe(0)
    expect(reactionEnvelope(0.2, 0.8)).toBeGreaterThan(0)
    expect(reactionEnvelope(0.2, 0.8)).toBeLessThan(1)
  })

  it('sways for 0.3 s with a decaying amplitude, then rests', () => {
    expect(swayAngle(0)).toBe(0)
    expect(swayAngle(0.3)).toBe(0)
    expect(swayAngle(1)).toBe(0)
    const samples = Array.from({ length: 29 }, (_, i) => Math.abs(swayAngle((i + 1) / 100)))
    expect(Math.max(...samples)).toBeGreaterThan(0)
    expect(Math.max(...samples)).toBeLessThanOrEqual(rad(3) + 1e-9)
  })
})

describe('classifyFps', () => {
  it('maps the average to ok, drop DPR to 1, or fall back to the poster', () => {
    expect(classifyFps(60)).toBe('ok')
    expect(classifyFps(45)).toBe('ok')
    expect(classifyFps(44.9)).toBe('dpr1')
    expect(classifyFps(30)).toBe('dpr1')
    expect(classifyFps(29.9)).toBe('fallback')
  })
})

describe('createFpsProbe (first 60 frames)', () => {
  it('stays quiet until 60 frame intervals are measured, then reports the average', () => {
    const probe = createFpsProbe()
    // Timestamp 0 is the baseline and the first interval is discarded (see below), so the 60
    // measured intervals end at timestamp index 61.
    for (let i = 0; i < 61; i += 1) expect(probe.frame(i * (1000 / 60))).toBeNull()
    const verdict = probe.frame(61 * (1000 / 60))
    expect(verdict?.action).toBe('ok')
    expect(verdict?.fps).toBeCloseTo(60, 3)
  })

  it('classifies a 40 fps device as dpr1 and a 20 fps device as fallback', () => {
    const run = (fps: number) => {
      const probe = createFpsProbe()
      let verdict = null as ReturnType<typeof probe.frame>
      for (let i = 0; i <= 61; i += 1) verdict = probe.frame(i * (1000 / fps))
      return verdict
    }
    expect(run(40)?.action).toBe('dpr1')
    expect(run(20)?.action).toBe('fallback')
  })

  it('ignores a single long first frame (shader compile) instead of failing the device for it', () => {
    const probe = createFpsProbe()
    probe.frame(0)
    // First measured interval is 400 ms: compile jank, not steady state.
    let verdict = probe.frame(400)
    let t = 400
    for (let i = 0; i < 60; i += 1) {
      t += 1000 / 60
      verdict = probe.frame(t)
    }
    expect(verdict?.action).toBe('ok')
  })

  it('reports once and then stays silent', () => {
    const probe = createFpsProbe()
    let reports = 0
    for (let i = 0; i < 200; i += 1) {
      if (probe.frame(i * 16.7)) reports += 1
    }
    expect(reports).toBe(1)
  })
})
