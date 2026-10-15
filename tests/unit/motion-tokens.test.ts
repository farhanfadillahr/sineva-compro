import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  cssVarName,
  dur,
  durSceneRange,
  ease,
  gsapEase,
  reducedMotionFadeMaxMs,
  revealDefaults,
  stagger,
  toCssEasing,
  toGsapSeconds,
} from '../../src/lib/motion/tokens'

// Values copied by hand from docs/design/motion.md section 2 on purpose: the test must fail if
// someone edits the TS tokens without also changing the design doc.
const DOCUMENTED_EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  bounce: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  in: 'cubic-bezier(0.5, 0, 0.8, 0.4)',
  wipe: 'cubic-bezier(0.7, 0, 0.25, 1)',
} as const

const DOCUMENTED_DUR = { instant: 60, fast: 160, base: 240, med: 360, slow: 520 } as const

const CSS_NAMES = {
  out: '--ease-out',
  outExpo: '--ease-out-expo',
  bounce: '--ease-bounce',
  inOut: '--ease-in-out',
  in: '--ease-in',
  wipe: '--ease-wipe',
} as const

describe('motion tokens: easing', () => {
  it.each(Object.entries(DOCUMENTED_EASE))(
    'ease.%s serialises to the documented curve',
    (k, css) => {
      expect(toCssEasing(ease[k as keyof typeof ease])).toBe(css)
    },
  )

  it('exposes exactly the six documented easings', () => {
    expect(Object.keys(ease).sort()).toEqual(Object.keys(DOCUMENTED_EASE).sort())
  })

  it('maps every easing to a CSS custom property name matching globals.css', () => {
    for (const k of Object.keys(DOCUMENTED_EASE)) {
      expect(cssVarName.ease[k as keyof typeof ease]).toBe(CSS_NAMES[k as keyof typeof CSS_NAMES])
    }
  })

  it('maps every easing to a GSAP ease string', () => {
    for (const k of Object.keys(ease)) {
      expect(gsapEase[k as keyof typeof ease]).toMatch(/^[a-z0-9]+\.(in|out|inOut)(\([\d.]+\))?$/i)
    }
    // The two curves that are exact standard easings (easeOutQuint, easeOutExpo).
    expect(gsapEase.out).toBe('power4.out')
    expect(gsapEase.outExpo).toBe('expo.out')
  })
})

describe('motion tokens: duration', () => {
  it.each(Object.entries(DOCUMENTED_DUR))('dur.%s is %i ms', (k, ms) => {
    expect(dur[k as keyof typeof dur]).toBe(ms)
  })

  it('documents --dur-scene as the 800 to 1200 ms range', () => {
    expect(durSceneRange).toEqual({ min: 800, max: 1200 })
  })

  it('names the duration custom properties', () => {
    expect(cssVarName.dur).toEqual({
      instant: '--dur-instant',
      fast: '--dur-fast',
      base: '--dur-base',
      med: '--dur-med',
      slow: '--dur-slow',
      scene: '--dur-scene',
    })
  })

  it('converts ms to the seconds GSAP expects', () => {
    expect(toGsapSeconds(dur.slow)).toBe(0.52)
    expect(toGsapSeconds(60)).toBe(0.06)
  })
})

describe('motion tokens: behaviour constants', () => {
  it('stagger is 40 to 60 ms, default 50, capped at 6 items', () => {
    expect(stagger).toEqual({ stepMs: 50, minStepMs: 40, maxStepMs: 60, maxItems: 6 })
  })

  it('reveal rises 24 px at a 15% threshold', () => {
    expect(revealDefaults).toEqual({ distancePx: 24, threshold: 0.15 })
  })

  it('keeps opacity fades of 150 ms or less under reduced motion', () => {
    expect(reducedMotionFadeMaxMs).toBe(150)
  })
})

// CPR-26 owns globals.css. Until its tokens land this block has nothing to compare; once they do,
// any drift between the CSS and the TS mirror fails here.
describe('motion tokens: parity with globals.css', () => {
  const cssPath = fileURLToPath(new URL('../../src/app/globals.css', import.meta.url))
  const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : ''
  const declared = (name: string) =>
    new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(css)?.[1]?.trim().replace(/\s+/g, ' ')

  it.each(Object.entries(CSS_NAMES))('ease.%s matches %s when declared', (k, name) => {
    const value = declared(name)
    if (value === undefined) return
    expect(value).toBe(DOCUMENTED_EASE[k as keyof typeof DOCUMENTED_EASE])
  })

  it.each(Object.entries(DOCUMENTED_DUR))('dur.%s matches --dur-%s when declared', (k, ms) => {
    const value = declared(`--dur-${k}`)
    if (value === undefined) return
    expect(value).toBe(`${ms}ms`)
  })

  it('--dur-scene, when declared, sits inside the documented range', () => {
    const value = declared('--dur-scene')
    if (value === undefined) return
    const ms = value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000
    expect(ms).toBeGreaterThanOrEqual(durSceneRange.min)
    expect(ms).toBeLessThanOrEqual(durSceneRange.max)
  })
})
