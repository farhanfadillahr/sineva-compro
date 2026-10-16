// Pure rules for the first-visit logo intro (docs/design/motion.md section 3.1). Kept free of
// React and the DOM so the policy can be read, and tested, in one place.

/**
 * Milliseconds since navigation start (`performance.now()`), not since React mounted: the
 * server-rendered shell and its CSS safety timers start at first paint, so the client timeline has
 * to share that clock or the two would drift apart.
 *
 * The hand-off has to start while the Lottie is still finishing: 1100 ms + the 500 ms flight lands
 * exactly on the 1600 ms cap. Starting it after the Lottie ends (1.5 s) would push the page past
 * the cap, and the cap is a hard rule (it protects conversion and Core Web Vitals).
 */
export const INTRO_TIMING = {
  /** The client layer is always gone by now, whatever else happens. */
  capMs: 1600,
  /** The shell stops intercepting the pointer after this (pure CSS, see logo-intro.module.css). */
  interactiveUntilMs: 1200,
  /** Shell fade during the hand-off. Pure CSS transition, mirrored here for the tests. */
  fadeMs: 200,
  /** Logo flight to the navbar slot. */
  flipMs: 500,
  handoffStartMs: 1100,
  /**
   * How long the client may wait for the player and the JSON. The intro never waits for the
   * network: past this the marker is removed and the shell fades.
   */
  readyDeadlineMs: 500,
  /**
   * Latest navigation-start time at which the client still starts the Lottie. Later (slow device,
   * slow hydration) there is not enough runway before the hand-off, so the shell just fades.
   */
  latestStartMs: 800,
  /**
   * Latest navigation-start time at which the jetpack launch video may start (splash-launch.ts).
   * Same clock as everything above. The clip is 1.1 s and Sino has left its frame after about
   * 0.8 s, so a start at 900 ms still gets her airborne before the 1.6 s cap; later than that the
   * video is dropped, never shown late.
   */
  launchDeadlineMs: 900,
} as const

/**
 * The document-level marker: `<html data-logo-intro="pending">`. The gate script sets it before
 * first paint, CSS shows the shell while it is present, and the client removes it when the intro
 * ends for any reason. It is the only channel between the three parts.
 */
export const INTRO_MARKER_PENDING = 'pending'

export const INTRO_LOTTIE_SRC = '/lottie/sineva-logo-intro.json'
export const SYMBOL_LOTTIE_SRC = '/lottie/sineva-symbol-intro.json'

/** The navbar logo wears this attribute; it is the FLIP landing slot and is hidden during the intro. */
export const INTRO_TARGET_ATTRIBUTE = 'data-logo-intro-target'

export type IntroGateInput = {
  /** Site setting `features.enableLogoIntro`. */
  enabled: boolean
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
  reducedMotion,
  webdriver,
  force = false,
}: IntroGateInput): boolean {
  if (!enabled || reducedMotion) return false
  if (webdriver && !force) return false
  return true
}

/**
 * The stacked Lottie (symbol above wordmark) lands on a horizontal navbar lockup, so the two
 * shapes never match exactly. The stage square is scaled to this multiple of the lockup height,
 * which puts the stacked artwork at roughly the lockup's visual size. Tuned by eye; not
 * load-bearing, because the overlay unmounts on the frame it lands on.
 */
const STAGE_TO_LOCKUP_HEIGHT = 3.4

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
