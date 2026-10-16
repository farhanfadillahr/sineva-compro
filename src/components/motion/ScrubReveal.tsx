'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useGsapContext } from '../../lib/motion/gsap'
import { observeVisibility } from '../../lib/motion/in-view'
import { revealPresets } from '../../lib/motion/tokens'
import { useReveal } from '../../lib/motion/use-reveal'
import type { RevealProps } from './Reveal'
import { revealClassName } from './reveal-class'
import styles from './ScrubReveal.module.css'

// Layout effects do not run on the server; useEffect there only keeps tooling quiet about it.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** True where CSS scroll-driven animations exist (Chromium, Safari 26). */
function supportsScrollTimeline(): boolean {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    ? CSS.supports('animation-timeline: view()')
    : false
}

/** Arm GSAP when the panel is within one viewport height of the screen, not on every page load. */
const ARM_MARGIN = '100% 0px'

/**
 * `rise-scale` for the final CTA panel: it scales from .94 and fades in, and its corners ease from
 * 48 px to the panel's own radius, tied to scroll position (ScrollTrigger `scrub: true`) while the
 * panel enters, with no clock involved.
 *
 * Layers, so the panel is never stuck hidden:
 * 1. Server HTML is the final state; nothing is hidden without JavaScript.
 * 2. `useReveal` applies the from state before first paint when the panel is below the fold. This
 *    is CSS only and also plays the effect as a one-shot if GSAP never arrives (offline chunk).
 * 3. Where the browser has scroll-driven CSS animations, the same from and to values run on a
 *    `view()` timeline (`data-scrub="css"`): scroll-tied like `scrub: true` and no JavaScript.
 *    Why not GSAP everywhere: its ~26 KB gzip would be new on Home, which already carries the
 *    Lottie intro, against the 60 KB animation budget (motion.md section 10).
 * 4. Everywhere else (Firefox, older Safari) GSAP loads once the panel is near the viewport and
 *    scrubs the same values, and the CSS state is released. `fromTo` renders the current scroll
 *    position at once, so the hand-over does not jump.
 *
 * Why the radius is a `clip-path` round and not `border-radius`: the brief limits scroll motion to
 * transform, opacity and clip-path. The panel keeps its own radius (the token); a clip with a
 * bigger radius is what the eye sees as the corner until the clip shrinks to the token value.
 */
export function ScrubReveal({
  as: Tag = 'div',
  index,
  delayMs,
  threshold,
  className,
  style,
  children,
  ...rest
}: Omit<RevealProps, 'variant'>) {
  const { ref, state, release, props } = useReveal<HTMLElement>({
    variant: 'rise-scale',
    index,
    delayMs,
    threshold,
  })
  const [armed, setArmed] = useState(false)
  const [native, setNative] = useState(false)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Before paint, like the from state itself: hand the panel to the browser's scroll timeline.
  useIsoLayoutEffect(() => {
    if (state !== 'hidden' || !supportsScrollTimeline()) return
    setNative(true)
    release()
  }, [state, release])

  useEffect(() => {
    const el = ref.current
    if (state !== 'hidden' || !el) return
    const stop = observeVisibility(
      el,
      (near) => {
        if (!near) return
        stop()
        setArmed(true)
      },
      { rootMargin: ARM_MARGIN },
    )
    return stop
  }, [ref, state])

  useGsapContext(
    ref,
    ({ gsap }) => {
      const el = ref.current
      // The CSS fallback already played it (fast scroll before the chunk arrived): leave it.
      if (!el || stateRef.current !== 'hidden') return
      const { scaleFrom, radiusFromPx } = revealPresets.riseScale
      // jsdom and a not-yet-styled element report 0 or nothing; the panel token is the fallback.
      const measured = parseFloat(getComputedStyle(el).borderTopLeftRadius)
      const radius = Number.isFinite(measured) && measured > 0 ? `${measured}px` : '36px'
      gsap.fromTo(
        el,
        { scale: scaleFrom, opacity: 0, clipPath: `inset(0px round ${radiusFromPx}px)` },
        {
          scale: 1,
          opacity: 1,
          clipPath: `inset(0px round ${radius})`,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            // `clamp` keeps the end reachable when the panel is too low on a short page to ever
            // scroll to the end marker.
            start: 'clamp(top 92%)',
            end: 'clamp(top 50%)',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
      release()
    },
    [],
    armed,
  )

  return (
    <Tag
      {...(rest as object)}
      ref={ref}
      data-reveal={props['data-reveal']}
      data-reveal-variant={props['data-reveal-variant']}
      data-scrub={native ? 'css' : undefined}
      className={[revealClassName('rise-scale', state, className), native && styles.native]
        .filter(Boolean)
        .join(' ')}
      style={{ ...style, ...props.style }}
      onTransitionEnd={props.onTransitionEnd}
    >
      {children}
    </Tag>
  )
}
