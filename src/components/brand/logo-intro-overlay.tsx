'use client'

import { useEffect, useRef } from 'react'
import { LottiePlayer } from '@/components/motion/LottiePlayer'
import { prefersReducedMotion, subscribeToReducedMotion } from '@/lib/motion/reduced-motion'
import { ease, toCssEasing } from '@/lib/motion/tokens'
import {
  flipTransform,
  INTRO_LOTTIE_SRC,
  INTRO_MARKER_PENDING,
  INTRO_TARGET_ATTRIBUTE,
  INTRO_TIMING,
} from './intro-gate'
import { observeLottieState } from './lottie-state'
import type { SplashLaunch } from './splash-launch'
import styles from './logo-intro.module.css'

// Window events that mean "the visitor wants the page now". Capture phase and passive: the overlay
// observes them but never consumes them, so the key press that skips the intro still reaches the
// page (Tab lands on the skip link, a click lands where it was aimed once the shell is gone).
const SKIP_EVENTS = ['keydown', 'wheel', 'touchstart', 'pointerdown'] as const

const releaseShell = () => {
  const html = document.documentElement
  if (html.dataset.logoIntro === INTRO_MARKER_PENDING) delete html.dataset.logoIntro
}

/**
 * The client half of the intro: plays the Lottie on top of the server-rendered shell, flies it to
 * the navbar logo, and releases the shell by removing the `data-logo-intro` marker, which makes the
 * shell fade out through CSS. Loaded with next/dynamic by LogoIntro, only when the gate marked the
 * document, so nobody else downloads this code or the Lottie player.
 *
 * Timeline, in ms since navigation start (the shell's clock; see INTRO_TIMING):
 *   hand-off 1100  marker removed (shell fades 200 ms) while the stage flies to the navbar (500 ms)
 *   cap      1600  unmounted, navbar logo shown again
 * The marker is also removed, ending everything, on skip input, reduced motion, a Lottie that
 * fails or is not ready within 500 ms, and a mount so late that the Lottie could not play.
 *
 * The jetpack launch (splash-launch.ts) plays in its own slot behind the logo, from the lower
 * centre, only if the clip is ready by INTRO_TIMING.launchDeadlineMs. It never delays or extends
 * anything above: not ready in time means it is dropped, and the logo plays as before. Every path
 * that ends the intro (skip input, cap, failure, reduced motion) goes through finish(), which
 * disposes the clip with the rest.
 *
 * Gotchas:
 * - The shell owns pointer interception (until 1.2 s, in CSS); this layer is always inert.
 * - The FLIP target is measured at hand-off time, not at mount, because the header can move
 *   (scroll restoration, font swap) in between.
 */
export function LogoIntroOverlay({
  onDone,
  launch = null,
}: {
  onDone: () => void
  launch?: SplashLaunch | null
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const launchSlotRef = useRef<HTMLDivElement>(null)
  // Read once: the clip is chosen before this layer mounts and never changes during the intro.
  const launchRef = useRef(launch)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return

    const target = document.querySelector<HTMLElement>(`[${INTRO_TARGET_ATTRIBUTE}]`)
    const targetOpacity = target?.style.opacity ?? ''
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const animations: Animation[] = []
    let finished = false
    // Assigned below; declared first because a Lottie that already failed calls finish() while
    // the observer is still being created.
    let stopObserving = () => {}
    let stopReducedMotion = () => {}
    let stopLaunch = () => {}
    const clip = launchRef.current

    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(
        () => {
          timers.delete(id)
          fn()
        },
        Math.max(0, ms),
      )
      timers.add(id)
    }

    const teardown = () => {
      for (const id of timers) clearTimeout(id)
      timers.clear()
      for (const a of animations) a.cancel()
      for (const type of SKIP_EVENTS) window.removeEventListener(type, finish, true)
      stopObserving()
      stopReducedMotion()
      stopLaunch()
      // The real logo was hidden so the flying copy is the only one on screen; opacity (not
      // visibility) keeps its layout box, so the measured landing rect stays valid.
      if (target) target.style.opacity = targetOpacity
    }

    function finish() {
      if (finished) return
      finished = true
      teardown()
      // The clip belongs to the takeover, which created it before this layer existed, so it is
      // not released in teardown(): StrictMode runs teardown between two mounts of the same layer
      // and would throw the clip away. Ending the intro is what ends the clip.
      clip?.dispose()
      releaseShell()
      onDoneRef.current()
    }

    const handoff = () => {
      const flip = target
        ? flipTransform(stage.getBoundingClientRect(), target.getBoundingClientRect())
        : null
      // No Web Animations API (very old browsers, jsdom): the cap timer still removes the layer.
      if (typeof stage.animate === 'function') {
        animations.push(
          flip
            ? stage.animate(
                [
                  { transform: 'translate(0px, 0px) scale(1)' },
                  { transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.scale})` },
                ],
                {
                  duration: INTRO_TIMING.flipMs,
                  easing: toCssEasing(ease.outExpo),
                  fill: 'forwards',
                },
              )
            : // Nowhere to land: fade the logo with the shell rather than fly it off screen.
              stage.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: INTRO_TIMING.fadeMs,
                easing: 'linear',
                fill: 'forwards',
              }),
        )
      }
      // Removing the marker is what fades the shell (200 ms, CSS), in parallel with the flight.
      releaseShell()
    }

    // Too late to be worth playing: the shell just fades.
    const elapsed = performance.now()
    if (elapsed > INTRO_TIMING.latestStartMs) {
      finish()
      return teardown
    }

    for (const type of SKIP_EVENTS) {
      window.addEventListener(type, finish, { capture: true, passive: true })
    }
    stopReducedMotion = subscribeToReducedMotion(() => {
      if (prefersReducedMotion()) finish()
    })
    stopObserving = observeLottieState(root, (state) => {
      if (state === 'ready') {
        if (target) target.style.opacity = '0'
      } else if (state === 'error') {
        finish()
      }
    })
    const slot = launchSlotRef.current
    if (clip && slot) {
      // Ready before this layer mounted (cached file) or later: either way one start, and
      // start() itself refuses past the deadline, so a slow clip is dropped rather than shown late.
      const tryStart = () => {
        if (!finished && clip.isReady()) clip.start(slot)
      }
      stopLaunch = clip.onReady(tryStart)
      tryStart()
    }
    after(INTRO_TIMING.readyDeadlineMs, () => {
      // Only the Lottie "ready" state keeps the intro alive past the deadline.
      if (root.querySelector('[data-lottie-state="ready"]') === null) finish()
    })
    after(INTRO_TIMING.handoffStartMs - elapsed, handoff)
    after(INTRO_TIMING.capMs - elapsed, finish)

    return teardown
  }, [])

  return (
    <div ref={rootRef} data-slot="logo-intro" aria-hidden="true" className={styles.root}>
      {/* Before the stage in the DOM, so the logo paints over Sino where they overlap. */}
      {launch ? (
        <div ref={launchSlotRef} data-slot="logo-intro-launch" className={styles.launch} />
      ) : null}
      <div ref={stageRef} data-slot="logo-intro-stage" className={styles.stage}>
        <LottiePlayer src={INTRO_LOTTIE_SRC} playOnce aspectRatio={1} width="100%" />
      </div>
    </div>
  )
}
