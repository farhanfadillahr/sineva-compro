import { describe, expect, it } from 'vitest'
import { flipTransform, INTRO_TIMING, shouldPlayIntro } from '../../src/components/brand/intro-gate'

const base = { enabled: true, reducedMotion: false, webdriver: false }

describe('shouldPlayIntro', () => {
  it('plays on every full page load with the toggle on, motion allowed and a human browser', () => {
    expect(shouldPlayIntro(base)).toBe(true)
  })

  it.each([
    ['the site toggle is off', { enabled: false }],
    ['the visitor prefers reduced motion', { reducedMotion: true }],
    ['the browser is automated', { webdriver: true }],
  ])('does not play when %s', (_label, override) => {
    expect(shouldPlayIntro({ ...base, ...override })).toBe(false)
  })

  describe('test-only force flag', () => {
    it('lets an automated browser through, so Lighthouse and Playwright can see the intro', () => {
      expect(shouldPlayIntro({ ...base, webdriver: true, force: true })).toBe(true)
    })

    it.each([
      ['the toggle is off', { enabled: false }],
      ['the visitor prefers reduced motion', { reducedMotion: true }],
    ])('never overrides a real user rule: %s', (_label, override) => {
      expect(shouldPlayIntro({ ...base, webdriver: true, force: true, ...override })).toBe(false)
    })
  })
})

describe('INTRO_TIMING', () => {
  it('keeps the hard rules of motion.md section 3.1', () => {
    expect(INTRO_TIMING.capMs).toBeLessThanOrEqual(1600)
    expect(INTRO_TIMING.interactiveUntilMs).toBe(1200)
    expect(INTRO_TIMING.fadeMs).toBe(200)
    expect(INTRO_TIMING.flipMs).toBe(500)
  })

  it('refuses to start an intro that could not play long enough before the hand-off', () => {
    expect(INTRO_TIMING.latestStartMs).toBeLessThan(INTRO_TIMING.handoffStartMs)
  })

  it('finishes the flight no later than the cap', () => {
    expect(INTRO_TIMING.handoffStartMs + INTRO_TIMING.flipMs).toBeLessThanOrEqual(
      INTRO_TIMING.capMs,
    )
  })
})

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect

describe('flipTransform', () => {
  it('moves the stage centre onto the target centre', () => {
    const stage = rect(400, 300, 200, 200) // centre 500, 400
    const target = rect(24, 20, 120, 28) // centre 84, 34
    const { x, y } = flipTransform(stage, target)!
    expect(x).toBe(84 - 500)
    expect(y).toBe(34 - 400)
  })

  it('shrinks the stage so the logo lands at navbar size', () => {
    const stage = rect(400, 300, 200, 200)
    const target = rect(24, 20, 120, 28)
    const { scale } = flipTransform(stage, target)!
    expect(scale).toBeGreaterThan(0)
    expect(scale).toBeLessThan(0.5)
  })

  it('returns null when there is nothing sensible to fly to', () => {
    const stage = rect(400, 300, 200, 200)
    expect(flipTransform(stage, rect(0, 0, 0, 0))).toBeNull()
    expect(flipTransform(rect(0, 0, 0, 0), rect(24, 20, 120, 28))).toBeNull()
    // Header hidden by scroll: its rect sits above the viewport.
    expect(flipTransform(stage, rect(24, -90, 120, 28))).toBeNull()
  })
})
