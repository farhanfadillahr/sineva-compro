import { pickLoopSource, readLoopEnv, type LoopKind } from '@/components/motion/sino-loop-source'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import { SPLASH_TIMING } from './splash-sequence'

// The clip of the first-load splash (docs/design/motion.md section 3.1): the pre-rendered one-shot
// `sino-launch` (720 x 960, 1.1 s, Sino stands, the jetpack ignites and she flies up out of frame,
// transparent background). Not the realtime canvas: the splash must not wait for three.js, a 1.1 MB
// GLB and a shader compile.
//
// This module owns the <video> element: choosing the file, starting the download early, playing it
// once, and reporting what it does. It owns no timing rule about the splash. When to give up on a
// slow clip (2.5 s), when to wipe and when to stop (5 s) belong to the sequence
// (logo-intro-overlay.tsx, splash-sequence.ts).
//
// Loading approach, and why it is not the obvious one:
// - The server-rendered shell cannot carry the <video>, and there is no <link rel="preload">.
//   Whether the splash plays is decided in the browser: Save-Data cannot be tested in markup or in
//   a media query, and the file depends on the engine (Chrome reports it can play HEVC but drops
//   the alpha channel, so the file is chosen by pickLoopSource, which needs script). A preload link
//   would send 390 KB to every visitor who never sees the splash, and to Safari the wrong file.
// - The gate script in <head> is the only code before first paint, but it is a byte-stable string
//   with one CSP hash, and it cannot reach <body> yet. It stays untouched.
// - So the takeover (logo-intro.tsx, in the main bundle, mounted right after hydration) calls
//   prepareSplashLaunch() the moment it sees the gate's marker. That starts the download before the
//   overlay chunk has been requested. The element stays detached until the overlay adopts it.
//
// "Ready" is canplaythrough (readyState 4, the browser expects to play to the end without
// stalling), not canplay. A Sino frozen mid-flight is worse than no Sino, and the files are small
// (webm 391 KB, mov 211 KB), so waiting for the stronger signal costs little.
//
// Measurement: the module writes User Timing marks, readable in DevTools (Performance > Timings) or
// via performance.getEntriesByType('mark'):
//   splash-launch:ready    the clip reached canplaythrough (detail.ms = navigation-start time)
//   splash-launch:play     play() was called
//   splash-launch:skipped  it was dropped without playing (deadline, skip input, error)

/** Same files the CTA launch overlay uses; both encodings of the same 720 x 960 clip. */
export const SPLASH_LAUNCH_SOURCES: Record<LoopKind, string> = {
  webm: '/mascot/launch/sino-launch.webm',
  mov: '/mascot/launch/sino-launch.mov',
}

/** HTMLMediaElement.HAVE_ENOUGH_DATA, spelled out so tests need no DOM constants. */
const HAVE_ENOUGH_DATA = 4

export type SplashClipState = 'loading' | 'ready' | 'playing' | 'ended' | 'failed' | 'disposed'
export type SplashClipEvent = 'ready' | 'playing' | 'ended' | 'failed'

export type SplashLaunch = {
  state(): SplashClipState
  /** The clip clock, in ms. The sequence derives the lift moment from it. */
  currentTimeMs(): number
  /** Called for each event after subscribing. Returns the stop function. */
  subscribe(listener: (event: SplashClipEvent) => void): () => void
  /** Put the video into `slot` and play it, once. Nothing happens after dispose(). */
  start(slot: HTMLElement): void
  /** Stops the download, pauses, removes the element. Safe to call twice. */
  dispose(): void
}

function mark(name: string) {
  try {
    if (typeof performance.mark === 'function') {
      performance.mark(name, { detail: { ms: Math.round(performance.now()) } })
    }
  } catch {
    // Marks are diagnostics only.
  }
}

function saveDataOn(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

/**
 * The splash rules the gate script cannot enforce (it is byte-stable): reduced motion again, as a
 * second lock, and Save-Data, which the script never reads. `navigator.webdriver` is deliberately
 * not here: the gate already refuses automation unless the LOGO_INTRO_FORCE build flag is on, and
 * a forced build has to play the clip too or headless verification would test a different splash.
 */
export function splashAllowed(): boolean {
  if (typeof document === 'undefined') return false
  return !prefersReducedMotion() && !saveDataOn()
}

/**
 * Starts loading the clip, or returns null when there is nothing to play: the splash is not allowed
 * or the browser has no playable alpha encoding. The caller then runs the splash without Sino.
 */
export function prepareSplashLaunch(): SplashLaunch | null {
  if (!splashAllowed()) return null
  const env = readLoopEnv()
  const kind = env && pickLoopSource(env)
  if (!kind) return null

  const video = document.createElement('video')
  // Muted is what lets play() succeed without a user gesture. defaultMuted writes the attribute,
  // which older iOS reads instead of the property.
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.disablePictureInPicture = true
  video.setAttribute('aria-hidden', 'true')
  video.tabIndex = -1
  // No `autoplay` attribute and no `loop`: playback is started from JS, once, and may be refused.
  video.preload = 'auto'
  video.src = SPLASH_LAUNCH_SOURCES[kind]
  video.load()

  let state: SplashClipState = 'loading'
  let started = false
  const listeners = new Set<(event: SplashClipEvent) => void>()

  const emit = (event: SplashClipEvent) => {
    for (const listener of [...listeners]) listener(event)
  }
  const fail = () => {
    if (state === 'disposed' || state === 'failed') return
    state = 'failed'
    emit('failed')
  }
  const onCanPlayThrough = () => {
    if (state !== 'loading') return
    state = 'ready'
    mark('splash-launch:ready')
    emit('ready')
  }
  const onPlaying = () => {
    if (state === 'playing' || state === 'ended' || state === 'disposed' || state === 'failed')
      return
    state = 'playing'
    emit('playing')
  }
  const onEnded = () => {
    if (state !== 'playing') return
    state = 'ended'
    emit('ended')
  }
  video.addEventListener('canplaythrough', onCanPlayThrough)
  video.addEventListener('playing', onPlaying)
  video.addEventListener('ended', onEnded)
  video.addEventListener('error', fail)

  // Owner of last resort: if the overlay never mounts (its chunk fails, hydration never finishes)
  // nobody would ever drop this, and the download would run on. After the hard stop no splash can
  // still be showing, so nothing is worth fetching.
  const lastResort = setTimeout(
    () => dispose(),
    Math.max(0, SPLASH_TIMING.hardStopMs - performance.now()),
  )

  function dispose() {
    if (state === 'disposed') return
    state = 'disposed'
    clearTimeout(lastResort)
    listeners.clear()
    video.removeEventListener('canplaythrough', onCanPlayThrough)
    video.removeEventListener('playing', onPlaying)
    video.removeEventListener('ended', onEnded)
    video.removeEventListener('error', fail)
    // Emptying src and calling load() is what cancels an in-flight download; pause() alone would
    // keep fetching a clip nobody will see.
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
    if (!started) mark('splash-launch:skipped')
  }

  return {
    state: () => {
      // readyState is the truth for a cached file that became ready before anyone listened.
      if (state === 'loading' && video.readyState >= HAVE_ENOUGH_DATA) return 'ready'
      return state
    },
    currentTimeMs: () => Math.round(video.currentTime * 1000),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start(slot) {
      if (state === 'disposed' || state === 'failed' || started) return
      started = true
      clearTimeout(lastResort)
      slot.appendChild(video)
      mark('splash-launch:play')
      // play() returns undefined in very old engines and a rejected promise when the autoplay
      // policy refuses; either way the sequence hears 'failed' and wipes without Sino.
      const playing = video.play() as Promise<void> | undefined
      playing?.catch(fail)
    },
    dispose,
  }
}
