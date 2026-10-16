// Which file of a loop this browser should get. Kept pure (the environment is passed in) so every
// browser case is a unit test instead of something only a real device can check.

/** The two alpha-capable encodings a loop ships in. */
export type LoopKind = 'webm' | 'mov'

export type LoopEnv = Readonly<{
  userAgent: string
  /** `navigator.maxTouchPoints`. Only used to tell iPadOS in desktop mode from a Mac. */
  maxTouchPoints: number
  /** `canPlayType('video/mp4; codecs="hvc1"')` is not empty. */
  canPlayHevc: boolean
  /** `canPlayType('video/webm; codecs="vp9"')` is not empty. */
  canPlayWebm: boolean
}>

const IOS = /iPhone|iPad|iPod/
// Every engine that says "Safari" in its UA without being Safari.
const NOT_SAFARI = /Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|OPiOS|Android/

/**
 * True for Safari on macOS and for every browser on iOS and iPadOS (Apple makes them all use
 * WebKit, so Chrome for iOS behaves like Safari here).
 */
function isWebKit({ userAgent, maxTouchPoints }: LoopEnv): boolean {
  if (IOS.test(userAgent)) return true
  // iPadOS 13+ asks for the desktop site and sends a Mac UA; a real Mac has no touch screen.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return true
  return /Safari\//.test(userAgent) && !NOT_SAFARI.test(userAgent)
}

/**
 * Pick by engine, not by `canPlayType` alone:
 * - WebKit gets the HEVC alpha MOV. Its WebM alpha support is unreliable, so a WebKit that cannot
 *   decode HEVC gets no video (`null`, the caller shows the poster) rather than a broken one.
 * - Everyone else gets the VP9 alpha WebM. Chrome on some platforms reports it can play HEVC
 *   (hardware decode) but throws the alpha channel away, which paints the transparent background
 *   as a black box. So `canPlayHevc` must never decide for a non-WebKit browser.
 */
export function pickLoopSource(env: LoopEnv): LoopKind | null {
  if (isWebKit(env)) return env.canPlayHevc ? 'mov' : null
  return env.canPlayWebm ? 'webm' : null
}

/** Read the live browser. `null` on the server, where nothing can play. */
export function readLoopEnv(): LoopEnv | null {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return null
  const probe = document.createElement('video')
  const can = (type: string) => (probe.canPlayType?.(type) ?? '') !== ''
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    canPlayHevc: can('video/mp4; codecs="hvc1"'),
    canPlayWebm: can('video/webm; codecs="vp9"'),
  }
}
