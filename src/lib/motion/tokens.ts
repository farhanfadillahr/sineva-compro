// TypeScript mirror of the motion custom properties in src/app/globals.css (docs/design/motion.md
// section 2). CSS stays the source of truth for anything CSS can animate; these values exist for
// JS that cannot read a custom property cheaply (GSAP tweens, timers, delays).
// tests/unit/motion-tokens.test.ts compares them with the doc and with globals.css.

export type Bezier = readonly [number, number, number, number]

export const ease = {
  out: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  bounce: [0.34, 1.35, 0.64, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.5, 0, 0.8, 0.4],
  wipe: [0.7, 0, 0.25, 1],
} as const satisfies Record<string, Bezier>

export type EaseName = keyof typeof ease

/** Durations in milliseconds, same numbers as `--dur-*`. */
export const dur = {
  instant: 60,
  fast: 160,
  base: 240,
  med: 360,
  slow: 520,
} as const

export type DurName = keyof typeof dur

/**
 * `--dur-scene` is documented as a range (hero entrance, Lottie intro), not a single value, so it
 * is not part of `dur`: a made-up midpoint here could silently disagree with the CSS token.
 */
export const durSceneRange = { min: 800, max: 1200 } as const

/** Sibling stagger: 40-60 ms, default 50, later items start together (motion.md section 2.2). */
export const stagger = { stepMs: 50, minStepMs: 40, maxStepMs: 60, maxItems: 6 } as const

/** Reveal on scroll (motion.md section 4.1). */
export const revealDefaults = { distancePx: 24, threshold: 0.15 } as const

/** Longest opacity fade that survives reduced motion (motion.md section 9). */
export const reducedMotionFadeMaxMs = 150

export const cssVarName = {
  ease: {
    out: '--ease-out',
    outExpo: '--ease-out-expo',
    bounce: '--ease-bounce',
    inOut: '--ease-in-out',
    in: '--ease-in',
    wipe: '--ease-wipe',
  },
  dur: {
    instant: '--dur-instant',
    fast: '--dur-fast',
    base: '--dur-base',
    med: '--dur-med',
    slow: '--dur-slow',
    scene: '--dur-scene',
  },
} as const satisfies { ease: Record<EaseName, string>; dur: Record<DurName | 'scene', string> }

export function toCssEasing(b: Bezier): string {
  return `cubic-bezier(${b.join(', ')})`
}

/** GSAP takes seconds. Whole-ms division keeps 520 ms at exactly 0.52. */
export function toGsapSeconds(ms: number): number {
  return Math.round(ms) / 1000
}

/**
 * GSAP ease strings for the same six curves. GSAP's CustomEase plugin could reproduce the exact
 * beziers, but it is an extra plugin download for a visual difference nobody can see, so these map
 * to built-in eases instead (GSAP powerN = polynomial of degree N+1: power2 cubic, power4 quintic):
 *  - out      exact easeOutQuint            -> power4.out
 *  - outExpo  exact easeOutExpo             -> expo.out
 *  - inOut    exact easeInOutCubic          -> power2.inOut
 *  - bounce   approximation: easeOutBack is (0.34, 1.56, 0.64, 1) = back.out(1.7); our overshoot
 *             is smaller (1.35), hence back.out(1.2)
 *  - in       approximation of a soft ease-in (exits only) -> power2.in
 *  - wipe     approximation of a strong in-out -> power3.inOut
 * Where the CSS curve and the GSAP string differ, prefer CSS for anything CSS can animate.
 */
export const gsapEase = {
  out: 'power4.out',
  outExpo: 'expo.out',
  bounce: 'back.out(1.2)',
  inOut: 'power2.inOut',
  in: 'power2.in',
  wipe: 'power3.inOut',
} as const satisfies Record<EaseName, string>
