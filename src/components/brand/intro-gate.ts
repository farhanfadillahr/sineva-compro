// Pure rules for the first-visit logo intro (docs/design/motion.md section 3.1). Kept free of
// React and the DOM so the policy can be read, and tested, in one place.

/**
 * Milliseconds, measured from the moment the overlay becomes visible.
 *
 * The hand-off has to start while the Lottie is still finishing: 1100 ms + the 500 ms flight lands
 * exactly on the 1600 ms cap. Starting it after the Lottie ends (1.5 s) would push the page past
 * the cap, and the cap is a hard rule (it protects conversion and Core Web Vitals).
 */
export const INTRO_TIMING = {
  /** The overlay is always gone by now, whatever else happens. */
  capMs: 1600,
  /** After this the overlay no longer intercepts the pointer. */
  interactiveUntilMs: 1200,
  /** Overlay background fade during the hand-off. */
  fadeMs: 200,
  /** Logo flight to the navbar slot. */
  flipMs: 500,
  handoffStartMs: 1100,
  /**
   * How long the overlay may stay invisible while the player and the JSON load. The intro never
   * waits for the network: past this the page simply carries on without it.
   */
  readyDeadlineMs: 500,
} as const

/** Session-storage slot, namespaced by `claimSessionOnce`. */
export const INTRO_SESSION_KEY = 'logo-intro'

export const INTRO_LOTTIE_SRC = '/lottie/sineva-logo-intro.json'
export const SYMBOL_LOTTIE_SRC = '/lottie/sineva-symbol-intro.json'

/** The navbar logo wears this attribute; it is the FLIP landing slot and is hidden during the intro. */
export const INTRO_TARGET_ATTRIBUTE = 'data-logo-intro-target'

export type IntroGateInput = {
  /** Site setting `features.enableLogoIntro`. */
  enabled: boolean
  /** The session already saw the intro (or storage could not say). */
  visited: boolean
  reducedMotion: boolean
  /** `navigator.webdriver`: Lighthouse, Playwright, uptime bots. */
  webdriver: boolean
  /**
   * Test and measurement builds only. Automation reports `navigator.webdriver`, which would hide
   * the intro from the very tools that have to verify it. It lifts the automation rule and nothing
   * else: a real visitor preference is never overridden.
   */
  force?: boolean
}

export function shouldPlayIntro({
  enabled,
  visited,
  reducedMotion,
  webdriver,
  force = false,
}: IntroGateInput): boolean {
  if (!enabled || visited || reducedMotion) return false
  if (webdriver && !force) return false
  return true
}

/**
 * The stacked Lottie (symbol above wordmark) lands on a horizontal navbar lockup, so the two
 * shapes never match exactly. The stage square is scaled to this multiple of the lockup height,
 * which puts the stacked artwork at roughly the lockup's visual size. Tuned by eye; not
 * load-bearing, because the overlay unmounts on the frame it lands on.
 */
const STAGE_TO_LOCKUP_HEIGHT = 2.2

/**
 * Transform that moves the stage's centre onto the target's centre while shrinking it to navbar
 * size. Transform-origin is the stage centre. Null when there is nothing sensible to fly to
 * (zero-sized boxes, or the header hidden above the viewport after a scroll restore): the caller
 * then fades the whole overlay instead, so the logo never flies off screen.
 */
export function flipTransform(
  stage: DOMRect,
  target: DOMRect,
): { x: number; y: number; scale: number } | null {
  if (stage.width <= 0 || stage.height <= 0) return null
  if (target.width <= 0 || target.height <= 0) return null
  if (target.top < 0 || target.left < 0) return null
  return {
    x: target.left + target.width / 2 - (stage.left + stage.width / 2),
    y: target.top + target.height / 2 - (stage.top + stage.height / 2),
    scale: (target.height * STAGE_TO_LOCKUP_HEIGHT) / stage.height,
  }
}
