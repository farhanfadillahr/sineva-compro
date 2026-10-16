import { pickLoopSource, readLoopEnv, type LoopKind } from '@/components/motion/sino-loop-source'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import { INTRO_TIMING } from './intro-gate'

// The jetpack launch on the first-visit splash (docs/design/motion.md section 3.1): the
// pre-rendered one-shot `sino-launch` (720 x 960, 1.1 s, Sino ignites the jetpack and flies up out
// of frame, transparent background), played inside the logo intro overlay. Not the realtime canvas:
// the splash must not wait for three.js, a 1.1 MB GLB and a shader compile.
//
// Loading approach, and why it is not the obvious one:
// - The server-rendered shell cannot carry the <video>. Whether the intro plays is decided in the
//   browser (sessionStorage), so a `preload="auto"` video in the shell would download 390 KB for
//   every visitor, including everyone who never sees the intro. It also could not pick the source:
//   Chrome reports it can play HEVC but drops the alpha channel, so the file has to be chosen by
//   engine (pickLoopSource), which needs script.
// - The gate script in <head> is the only code that runs before first paint, but it is a byte
//   stable 338-byte string with one CSP hash, and it cannot reach <body> yet. It stays untouched.
// - So the takeover (logo-intro.tsx, in the main bundle, mounted right after hydration) calls
//   prepareSplashLaunch() the moment it sees the gate's marker. That starts the download before the
//   overlay chunk and the Lottie JSON have even been requested, so all three fetches overlap.
// - The element stays detached until it is ready, then the overlay adopts and plays it. A video
//   that loads late is never shown late: the deadline below drops it and cancels the download.
//
// "Ready" is canplaythrough (readyState 4, the browser expects to play to the end without
// stalling), not canplay. A Sino frozen mid-flight is worse than no Sino, and the files are small
// (webm 391 KB, mov 211 KB), so waiting for the stronger signal costs little.
//
// Measurement: the file sizes above and a curl of the production server are the only numbers
// gathered offline (see motion.md). Real readiness depends on the visitor's network, so the module
// writes User Timing marks, readable in DevTools (Performance > Timings) or via
// performance.getEntriesByType('mark'):
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

export type SplashLaunch = {
  /** The browser expects to play the clip through without stalling, and it was not dropped. */
  isReady(): boolean
  /** Called once when the clip becomes ready. Returns the stop function. */
  onReady(listener: () => void): () => void
  /**
   * Put the video into `slot` and play it. Past the deadline it drops the clip instead.
   * `data-playing` goes on the slot at the first presented frame; CSS times the dissolve from it.
   */
  start(slot: HTMLElement): void
  /** Stops the download, pauses, removes the element and the marks' timers. Safe to call twice. */
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
 * Starts loading the launch clip, or returns null when it must not play at all. The null cases are
 * the gate's own rules plus the two the gate cannot know: Save-Data (the logo itself is tiny, the
 * video is not) and a browser with no playable alpha encoding. Webdriver and reduced motion are
 * refused here too, even though the gate already keeps them out: this is what makes "automation
 * never renders it" true for builds that force the logo intro on for Lighthouse.
 */
export function prepareSplashLaunch(): SplashLaunch | null {
  if (typeof document === 'undefined') return null
  if (navigator.webdriver || prefersReducedMotion() || saveDataOn()) return null
  // Same rule as the overlay: past this the intro does not play, so nothing is worth fetching.
  if (performance.now() > INTRO_TIMING.latestStartMs) return null
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

  let disposed = false
  let started = false
  let readyFired = false
  const listeners = new Set<() => void>()

  const ready = () => !disposed && video.readyState >= HAVE_ENOUGH_DATA
  const onCanPlayThrough = () => {
    if (disposed || readyFired) return
    readyFired = true
    mark('splash-launch:ready')
    for (const listener of [...listeners]) listener()
  }
  const onError = () => dispose()
  video.addEventListener('canplaythrough', onCanPlayThrough)
  video.addEventListener('error', onError)

  // The overlay can fail to mount (its chunk fails, it mounts too late), and then nobody would
  // ever start or drop this. The deadline is the owner of last resort.
  const deadline = setTimeout(
    () => {
      if (!started) dispose()
    },
    Math.max(0, INTRO_TIMING.launchDeadlineMs - performance.now()),
  )

  function dispose() {
    if (disposed) return
    disposed = true
    clearTimeout(deadline)
    listeners.clear()
    video.removeEventListener('canplaythrough', onCanPlayThrough)
    video.removeEventListener('error', onError)
    // Emptying src and calling load() is what cancels an in-flight download; pause() alone would
    // keep fetching a clip nobody will see.
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
    if (!started) mark('splash-launch:skipped')
  }

  return {
    isReady: ready,
    onReady(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start(slot) {
      if (disposed || started) return
      if (performance.now() > INTRO_TIMING.launchDeadlineMs) {
        dispose()
        return
      }
      started = true
      clearTimeout(deadline)
      video.addEventListener('playing', () => slot.setAttribute('data-playing', ''), { once: true })
      slot.appendChild(video)
      mark('splash-launch:play')
      // play() returns undefined in very old engines and a rejected promise when the autoplay
      // policy refuses; either way the intro goes on without the clip.
      const playing = video.play() as Promise<void> | undefined
      playing?.catch(() => dispose())
    },
    dispose,
  }
}
