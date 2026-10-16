// The pure half of the first-load splash (docs/design/motion.md section 3.1): the numbers measured
// from the clip, the owner's safety timers, the wipe geometry and the state machine. No DOM, no
// timers and no React, so every rule is a unit test instead of something only a browser can check.

/**
 * Measured from `public/mascot/launch/sino-launch.{webm,mov}` (720 x 960, 24 fps, 28 frames) with
 * ffprobe and a per-frame alpha bounding box (ffmpeg cropdetect on the alpha plane, limit 0.03):
 * - Sino stands from 0 to about 330 ms: the silhouette spans y 204 to 924 of the 960 px frame, and
 *   her boots rest at y 924 to 930.
 * - She sinks slightly and the jetpack ignites; her boots start to rise 4 px at 333 ms, 12 px by
 *   458 ms (2 to 4 px per frame), then 34 px at 500 ms, 82 px at 542 ms and about 100 px per frame
 *   after that. 460 ms is where the climb stops being a settle and starts being a flight: the lift
 *   moment, where the wipe starts.
 * - The silhouette touches the top of the frame from 667 ms; the last pixels (boots, then a faint
 *   trail) are gone by 875 ms and the frame is fully transparent from 917 ms. 900 ms is where she
 *   has left, and where the wipe ends. The empty tail up to 1167 ms is not waited for.
 */
export const SPLASH_CLIP = {
  durationMs: 1167,
  liftMs: 460,
  exitMs: 900,
} as const

/**
 * Owner rules (2026-10-16). `noVideoDeadlineMs` and `hardStopMs` are on the navigation-start clock
 * (`performance.now()`), the same clock as the shell's CSS timers; the rest are durations.
 */
export const SPLASH_TIMING = {
  /** The clip must be playing by now, or the splash wipes without Sino. */
  noVideoDeadlineMs: 2500,
  /** The wipe when there is no Sino. */
  fallbackWipeMs: 400,
  /** The wipe after a key, click or scroll, and after a clip failure: fast, never abrupt. */
  skipWipeMs: 220,
  /** The clip clock has not moved for this long while it should be playing: it is stalled. */
  stallMs: 600,
  /** Whatever else happens, the overlay is gone at this time. */
  hardStopMs: 5000,
  /** How often the clip clock is read while the sequence waits for the lift moment. */
  pollMs: 16,
} as const

/**
 * How far the curved leading edge bulges below its sides, in svh. The bulge is parked below the
 * bottom edge of the viewport at progress 0 (negative bottom inset), so a fully covering overlay
 * shows no wedge of page in its bottom corners, and it shrinks to nothing as the edge reaches the
 * top. Sino is centred, so the middle of the edge, below her feet, leads her and the sides trail.
 */
const BULGE_SVH = 10

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * `clip-path` for a wipe `progress` of 0 (covering) to 1 (page fully open). Every progress yields
 * the same function shape (calc in the bottom inset, svh radii), which is what lets the browser
 * interpolate between any two of them in a Web Animation. clip-path is compositor-friendly and the
 * only property that moves.
 */
export function wipeClipPath(progress: number): string {
  const p = clamp01(progress)
  const bulge = round(BULGE_SVH * (1 - p))
  return (
    `inset(0px 0px calc(${round(p * 100)}% - ${bulge}svh) 0px ` +
    `round 0px 0px 50% 50% / 0px 0px ${bulge}svh ${bulge}svh)`
  )
}

export type WipePlan = { fromProgress: number; durationMs: number }

/**
 * The lift wipe, derived from where the clip is (`videoMs`, its `currentTime`) at the moment the
 * sequence sees it reach the lift. It always ends at `SPLASH_CLIP.exitMs`: a clip that is late (a
 * slow poll, a hitch) starts part way in instead of running long, so the page never opens after
 * Sino has gone and never before she lifts.
 */
export function planLiftWipe(videoMs: number): WipePlan {
  const { liftMs, exitMs } = SPLASH_CLIP
  if (videoMs >= exitMs) return { fromProgress: 1, durationMs: 0 }
  if (videoMs <= liftMs) return { fromProgress: 0, durationMs: exitMs - liftMs }
  return { fromProgress: (videoMs - liftMs) / (exitMs - liftMs), durationMs: exitMs - videoMs }
}

/** Finish a wipe that is at `progress` in the same fraction of `totalMs` that is left of it. */
export function planRestWipe(progress: number, totalMs: number): WipePlan {
  const p = clamp01(progress)
  return { fromProgress: p, durationMs: Math.round((1 - p) * totalMs) }
}

/** Progress of a linear wipe, `elapsedMs` after it started from `fromProgress`. */
export function wipeProgressAt(
  elapsedMs: number,
  fromProgress: number,
  durationMs: number,
): number {
  if (durationMs <= 0) return 1
  return clamp01(fromProgress + (1 - fromProgress) * (elapsedMs / durationMs))
}

/** Time left to a deadline on the navigation-start clock. */
export function msUntil(deadlineMs: number, nowMs: number): number {
  return Math.max(0, deadlineMs - nowMs)
}

/**
 * - cover   the overlay is up and fully covering, waiting for the clip to start playing
 * - launch  the clip is playing, still fully covering (Sino stands and ignites)
 * - wipe    the overlay is opening from the bottom to the top; `wipe` says why and how fast
 * - done    the overlay is gone, scroll is back, the page is usable
 */
export type SplashPhase = 'cover' | 'launch' | 'wipe' | 'done'
export type WipeKind = 'lift' | 'fallback' | 'fast'
export type SplashState = { phase: SplashPhase; wipe: WipeKind | null }

export type SplashEvent = {
  type:
    | 'clipPlaying'
    | 'clipLift'
    | 'clipEnded'
    | 'clipFailed'
    | 'noClipDeadline'
    | 'skip'
    | 'wipeDone'
    | 'hardStop'
}

export const initialSplashState: SplashState = { phase: 'cover', wipe: null }

const FAST: SplashState = { phase: 'wipe', wipe: 'fast' }
const DONE: SplashState = { phase: 'done', wipe: null }

/**
 * The page opens only after the animation: `done` is reachable from a covering phase only through
 * `hardStop`; everything else goes through a wipe and its `wipeDone`.
 */
export function nextSplashState(state: SplashState, event: SplashEvent): SplashState {
  if (state.phase === 'done') return state
  if (event.type === 'hardStop') return DONE

  switch (event.type) {
    case 'clipPlaying':
      return state.phase === 'cover' ? { phase: 'launch', wipe: null } : state
    case 'clipLift':
      return state.phase === 'launch' ? { phase: 'wipe', wipe: 'lift' } : state
    case 'noClipDeadline':
      return state.phase === 'cover' ? { phase: 'wipe', wipe: 'fallback' } : state
    case 'clipFailed':
      // A failure while the fallback wipe already runs changes nothing: there is no Sino to lose.
      return state.phase === 'wipe' && state.wipe !== 'lift' ? state : FAST
    case 'clipEnded':
      // Ending after the lift is the normal tail. Ending before it means the clip skipped ahead
      // or was cut: no lift is coming, so open the page now instead of waiting for it.
      return state.phase === 'wipe' ? state : FAST
    case 'skip':
      return state.wipe === 'fast' ? state : FAST
    case 'wipeDone':
      return state.phase === 'wipe' ? DONE : state
  }
}
