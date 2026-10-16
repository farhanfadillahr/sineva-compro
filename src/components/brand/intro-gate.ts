// Pure rules for the first-load splash (docs/design/motion.md section 3.1). Kept free of React and
// the DOM so the policy can be read, and tested, in one place. The timing of the sequence itself is
// in splash-sequence.ts.

/**
 * The document-level marker: `<html data-logo-intro="pending">`. The gate script sets it before
 * first paint, CSS shows the shell while it is present, and the client removes it when the splash
 * ends for any reason. It is the only channel between the three parts, and the hero's first wave
 * (sino-runtime.ts) also waits for it to go.
 */
export const INTRO_MARKER_PENDING = 'pending'

/**
 * Set by the client overlay while it is the cover (`<html data-logo-intro-live>`). It makes CSS hide
 * the shell at once, so the shell can never stay in front of the page while the overlay wipes it
 * open. The marker above stays until the wipe is done; this one is removed with it.
 */
export const INTRO_LIVE_ATTRIBUTE = 'data-logo-intro-live'

/** The animation of the navbar logo's hover replay (logo-symbol.tsx). Not part of the splash. */
export const SYMBOL_LOTTIE_SRC = '/lottie/sineva-symbol-intro.json'

export type IntroGateInput = {
  /** Site setting `features.enableLogoIntro`. */
  enabled: boolean
  reducedMotion: boolean
  /** `navigator.webdriver`: Lighthouse, Playwright, uptime bots. */
  webdriver: boolean
  /**
   * Test and measurement builds only. Automation reports `navigator.webdriver`, which would hide
   * the splash from the very tools that have to verify it. It lifts the automation rule and nothing
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
