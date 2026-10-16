'use client'

import { useEffect, useRef } from 'react'
import { LottiePlayer } from '@/components/motion/LottiePlayer'
import { prefersReducedMotion, subscribeToReducedMotion } from '@/lib/motion/reduced-motion'
import { ease, toCssEasing } from '@/lib/motion/tokens'
import { flipTransform, INTRO_LOTTIE_SRC, INTRO_TARGET_ATTRIBUTE, INTRO_TIMING } from './intro-gate'
import { observeLottieState } from './lottie-state'
import styles from './logo-intro.module.css'

// Window events that mean "the visitor wants the page now". Capture phase and passive: the overlay
// observes them but never consumes them, so the key press that skips the intro still reaches the
// page (Tab lands on the skip link, a click lands where it was aimed once the overlay is gone).
const SKIP_EVENTS = ['keydown', 'wheel', 'touchstart', 'pointerdown'] as const

/**
 * The overlay itself. Loaded with next/dynamic by LogoIntro, only after the gate said yes, so
 * nobody else downloads this code or the Lottie player.
 *
 * Timeline (ms from the moment it becomes visible; see INTRO_TIMING):
 *   0      the Lottie plays on a solid canvas layer, the real navbar logo is hidden
 *   1100   hand-off: backdrop fades 200 ms while the stage flies to the navbar logo (500 ms)
 *   1200   pointer-events none
 *   1600   unmounted, navbar logo shown again
 * Skip events and reduced motion end it at once. If the Lottie is not ready within the ready
 * deadline (or fails) it ends without ever having been visible.
 *
 * Gotcha: the FLIP target is measured at hand-off time, not at mount, because the header can move
 * (scroll restoration, font swap) between the two.
 */
export function LogoIntroOverlay({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const root = rootRef.current
    const backdrop = backdropRef.current
    const stage = stageRef.current
    if (!root || !backdrop || !stage) return

    const target = document.querySelector<HTMLElement>(`[${INTRO_TARGET_ATTRIBUTE}]`)
    const targetOpacity = target?.style.opacity ?? ''
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const animations: Animation[] = []
    let shown = false
    let finished = false
    // Assigned below; declared first because a Lottie that already failed calls finish() while
    // the observer is still being created.
    let stopObserving = () => {}
    let stopReducedMotion = () => {}

    // Inert until the Lottie is ready: an invisible layer must not swallow clicks.
    root.style.pointerEvents = 'none'

    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }

    // The real logo is hidden for the duration so the flying copy is the only one on screen;
    // opacity (not visibility) keeps its layout box, so the measured landing rect stays valid.
    const restoreTarget = () => {
      if (target) target.style.opacity = targetOpacity
    }

    const teardown = () => {
      for (const id of timers) clearTimeout(id)
      timers.clear()
      for (const a of animations) a.cancel()
      for (const type of SKIP_EVENTS) window.removeEventListener(type, finish, true)
      stopObserving()
      stopReducedMotion()
      restoreTarget()
    }

    function finish() {
      if (finished) return
      finished = true
      teardown()
      onDoneRef.current()
    }

    const handoff = () => {
      const flip = target
        ? flipTransform(stage.getBoundingClientRect(), target.getBoundingClientRect())
        : null
      // No Web Animations API (very old browsers, jsdom): the cap timer still removes the overlay.
      if (typeof stage.animate !== 'function') return
      animations.push(
        backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: INTRO_TIMING.fadeMs,
          easing: 'linear',
          fill: 'forwards',
        }),
      )
      if (flip) {
        animations.push(
          stage.animate(
            [
              { transform: 'translate(0px, 0px) scale(1)' },
              { transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.scale})` },
            ],
            {
              duration: INTRO_TIMING.flipMs,
              easing: toCssEasing(ease.outExpo),
              fill: 'forwards',
            },
          ),
        )
      } else {
        // Nowhere to land: fade the logo with the backdrop rather than fly it off screen.
        animations.push(
          stage.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: INTRO_TIMING.fadeMs,
            easing: 'linear',
            fill: 'forwards',
          }),
        )
      }
    }

    const show = () => {
      if (shown || finished) return
      shown = true
      root.dataset.state = 'live'
      root.style.pointerEvents = ''
      if (target) target.style.opacity = '0'
      after(INTRO_TIMING.handoffStartMs, handoff)
      after(INTRO_TIMING.interactiveUntilMs, () => {
        root.style.pointerEvents = 'none'
      })
      after(INTRO_TIMING.capMs, finish)
    }

    for (const type of SKIP_EVENTS) {
      window.addEventListener(type, finish, { capture: true, passive: true })
    }
    stopReducedMotion = subscribeToReducedMotion(() => {
      if (prefersReducedMotion()) finish()
    })
    stopObserving = observeLottieState(root, (state) => {
      if (state === 'ready') show()
      else if (state === 'error') finish()
    })
    after(INTRO_TIMING.readyDeadlineMs, () => {
      if (!shown) finish()
    })

    return teardown
  }, [])

  return (
    <div
      ref={rootRef}
      data-slot="logo-intro"
      data-state="pending"
      aria-hidden="true"
      className={styles.root}
    >
      <div ref={backdropRef} data-slot="logo-intro-backdrop" className={styles.backdrop} />
      <div ref={stageRef} data-slot="logo-intro-stage" className={styles.stage}>
        <LottiePlayer src={INTRO_LOTTIE_SRC} playOnce aspectRatio={1} width="100%" />
      </div>
    </div>
  )
}
