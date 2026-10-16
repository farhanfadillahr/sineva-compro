'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion, subscribeToReducedMotion } from '@/lib/motion/reduced-motion'
import { INTRO_LIVE_ATTRIBUTE, INTRO_MARKER_PENDING } from './intro-gate'
import { lockScroll } from './splash-scroll-lock'
import type { SplashLaunch } from './splash-launch'
import {
  initialSplashState,
  msUntil,
  nextSplashState,
  planLiftWipe,
  planRestWipe,
  SPLASH_CLIP,
  SPLASH_TIMING,
  wipeClipPath,
  wipeProgressAt,
  type SplashEvent,
  type SplashState,
} from './splash-sequence'
import styles from './logo-intro.module.css'

// Window events that mean "the visitor wants the page now". Capture phase and passive: the overlay
// observes them but never consumes them, so the key press that skips the splash still reaches the
// page (Tab lands on the skip link once the cover is gone).
const SKIP_EVENTS = ['keydown', 'wheel', 'touchstart', 'pointerdown'] as const

/**
 * The client half of the splash (docs/design/motion.md section 3.1). A full-screen layer in the
 * canvas colour with Sino centred: the clip plays, she stands, ignites and lifts off, and as she
 * lifts the layer opens from the bottom to the top, following her flight, with `clip-path`. The
 * page is revealed below her. The layer stays fully covering until the clip reaches the lift
 * moment, and is removed only when the wipe, which ends where she leaves the top of the screen, is
 * done: the page opens after the animation, never before. Loaded with next/dynamic by LogoIntro,
 * only when the gate marked the document.
 *
 * The rules of the sequence are in splash-sequence.ts (state machine, timings, wipe geometry); this
 * component only turns its transitions into effects. In ms since navigation start (the shell's
 * clock):
 *   2500  the clip must be playing by now, or a 400 ms wipe without Sino
 *   5000  the overlay is gone, whatever else happens
 * The clip failing or stalling, and any key, click or scroll, give a fast wipe.
 *
 * Gotchas:
 * - The wipe starts from the clip's own clock (`currentTime`, polled every 16 ms), not from a
 *   timer after `playing`: the first frame can be presented late and a buffering hitch would
 *   otherwise put the page ahead of Sino. A late poll starts the wipe part way in, so it still
 *   ends with her exit.
 * - The wipe is a linear Web Animation of `clip-path` on this layer, so its progress is plain
 *   arithmetic (wipeProgressAt). That is what lets a skip continue from where the wipe is instead
 *   of jumping. The end of the wipe is a timer, not an animation event: it is the authority the
 *   tests and the marker release rely on, and the animation only draws.
 * - While this layer is up the shell is hidden (INTRO_LIVE_ATTRIBUTE): same colour, but the shell
 *   is not clipped and would cover the page the wipe reveals. The marker stays until the end, so
 *   the hero's first wave waits for the real end of the splash.
 * - Clicks are swallowed until the end (a pointerdown already counts as the skip): a half revealed
 *   page must not act on a click meant for something else. The click handler is capture phase and
 *   removed with everything else.
 * - The clip is owned by the takeover, which created it before this layer existed. Cleanup does
 *   not dispose it, because StrictMode runs cleanup between two mounts of the same layer; ending
 *   the splash does.
 */
export function LogoIntroOverlay({
  onDone,
  launch = null,
}: {
  onDone: () => void
  launch?: SplashLaunch | null
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  // Read once: the clip is chosen before this layer mounts and never changes during the splash.
  const launchRef = useRef(launch)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const html = document.documentElement
    const clip = launchRef.current

    let state: SplashState = initialSplashState
    let torndown = false
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let poll: ReturnType<typeof setInterval> | null = null
    let animation: Animation | null = null
    let wipeEnd: ReturnType<typeof setTimeout> | null = null
    let wipe: { startedAt: number; fromProgress: number; durationMs: number } | null = null
    let lastClipMs = -1
    let lastClipMoveAt = 0
    let unlockScroll = () => {}
    let stopReducedMotion = () => {}
    let stopClip = () => {}

    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(
        () => {
          timers.delete(id)
          fn()
        },
        Math.max(0, ms),
      )
      timers.add(id)
      return id
    }

    const swallowClick = (event: Event) => {
      event.stopPropagation()
      event.preventDefault()
    }
    const skip = () => dispatch({ type: 'skip' })

    function teardown() {
      if (torndown) return
      torndown = true
      for (const id of timers) clearTimeout(id)
      timers.clear()
      if (poll) clearInterval(poll)
      animation?.cancel()
      for (const type of SKIP_EVENTS) window.removeEventListener(type, skip, true)
      window.removeEventListener('click', swallowClick, true)
      stopReducedMotion()
      stopClip()
      unlockScroll()
      html.removeAttribute(INTRO_LIVE_ATTRIBUTE)
    }

    // Starts (or restarts, from `fromProgress`) the one linear clip-path animation of this layer.
    function runWipe(fromProgress: number, durationMs: number) {
      animation?.cancel()
      animation = null
      // The end timer of the wipe being replaced must not fire into the new one.
      if (wipeEnd) {
        clearTimeout(wipeEnd)
        timers.delete(wipeEnd)
      }
      wipe = { startedAt: performance.now(), fromProgress, durationMs }
      root!.style.willChange = 'clip-path'
      // No Web Animations API (very old browsers, jsdom): the layer simply stays until the timer
      // below ends the wipe, which still opens the page, only without the motion.
      if (typeof root!.animate === 'function') {
        animation = root!.animate(
          [{ clipPath: wipeClipPath(fromProgress) }, { clipPath: wipeClipPath(1) }],
          { duration: durationMs, easing: 'linear', fill: 'forwards' },
        )
      }
      wipeEnd = after(durationMs, () => dispatch({ type: 'wipeDone' }))
    }

    function currentProgress(): number {
      return wipe
        ? wipeProgressAt(performance.now() - wipe.startedAt, wipe.fromProgress, wipe.durationMs)
        : 0
    }

    function enter(next: SplashState, previous: SplashState) {
      if (next.phase === 'launch') {
        lastClipMs = clip?.currentTimeMs() ?? 0
        lastClipMoveAt = performance.now()
        poll = setInterval(watchClip, SPLASH_TIMING.pollMs)
        return
      }
      if (next.phase === 'done') {
        teardown()
        clip?.dispose()
        // One block, so the shell never gets a frame in which it is pending but no longer hidden.
        if (html.dataset.logoIntro === INTRO_MARKER_PENDING) delete html.dataset.logoIntro
        onDoneRef.current()
        return
      }
      if (next.phase !== 'wipe') return

      if (next.wipe === 'lift') {
        const plan = planLiftWipe(clip?.currentTimeMs() ?? SPLASH_CLIP.liftMs)
        runWipe(plan.fromProgress, plan.durationMs)
      } else if (next.wipe === 'fallback') {
        clip?.dispose()
        runWipe(0, SPLASH_TIMING.fallbackWipeMs)
      } else {
        // fast: from wherever the wipe is, or from covering. A clip that failed has nothing left to
        // show; one that is merely skipped keeps standing until the edge passes her.
        const wasWiping = previous.phase === 'wipe'
        const plan = planRestWipe(wasWiping ? currentProgress() : 0, SPLASH_TIMING.skipWipeMs)
        runWipe(plan.fromProgress, plan.durationMs)
      }
    }

    function dispatch(event: SplashEvent) {
      if (torndown) return
      const previous = state
      state = nextSplashState(state, event)
      if (state === previous) return
      if (event.type === 'clipFailed') clip?.dispose()
      enter(state, previous)
    }

    // Reads the clip clock: the lift moment starts the wipe, a clock that stopped is a stall.
    function watchClip() {
      if (!clip || clip.state() !== 'playing') return
      const ms = clip.currentTimeMs()
      const at = performance.now()
      if (ms !== lastClipMs) {
        lastClipMs = ms
        lastClipMoveAt = at
      } else if (at - lastClipMoveAt >= SPLASH_TIMING.stallMs) {
        dispatch({ type: 'clipFailed' })
        return
      }
      if (state.phase === 'launch' && ms >= SPLASH_CLIP.liftMs) dispatch({ type: 'clipLift' })
    }

    // The cover is this layer from now on. The marker stays: it is what the shell and the hero wait
    // for, and it ends with the wipe.
    html.setAttribute(INTRO_LIVE_ATTRIBUTE, '')
    unlockScroll = lockScroll()

    const startedAt = performance.now()
    if (startedAt >= SPLASH_TIMING.hardStopMs) {
      dispatch({ type: 'hardStop' })
      return teardown
    }

    for (const type of SKIP_EVENTS)
      window.addEventListener(type, skip, { capture: true, passive: true })
    window.addEventListener('click', swallowClick, true)
    stopReducedMotion = subscribeToReducedMotion(() => {
      // Reduced motion ends the splash outright, with no wipe at all.
      if (prefersReducedMotion()) dispatch({ type: 'hardStop' })
    })
    // Due now (a late mount) means act now, in this effect, not after a 0 ms timer.
    const at = (deadlineMs: number, event: SplashEvent) => {
      const wait = msUntil(deadlineMs, startedAt)
      if (wait === 0) dispatch(event)
      else after(wait, () => dispatch(event))
    }
    at(SPLASH_TIMING.hardStopMs, { type: 'hardStop' })
    at(SPLASH_TIMING.noVideoDeadlineMs, { type: 'noClipDeadline' })

    const slot = slotRef.current
    if (state.phase !== 'cover') {
      // A late mount already went to the fallback wipe: nothing to play.
    } else if (!clip || !slot) {
      // No clip to wait for: the splash is just the wipe.
      dispatch({ type: 'noClipDeadline' })
    } else {
      const adopt = () => {
        if (state.phase === 'cover' && clip.state() === 'ready') clip.start(slot)
      }
      stopClip = clip.subscribe((event) => {
        if (event === 'ready') adopt()
        else if (event === 'playing') dispatch({ type: 'clipPlaying' })
        else if (event === 'ended') dispatch({ type: 'clipEnded' })
        else dispatch({ type: 'clipFailed' })
      })
      const initial = clip.state()
      if (initial === 'failed' || initial === 'disposed') dispatch({ type: 'clipFailed' })
      else if (initial === 'playing') dispatch({ type: 'clipPlaying' })
      else adopt()
    }

    return teardown
  }, [])

  return (
    <div ref={rootRef} data-slot="logo-intro" aria-hidden="true" className={styles.root}>
      {launch ? (
        <div ref={slotRef} data-slot="logo-intro-launch" className={styles.launch} />
      ) : null}
    </div>
  )
}
