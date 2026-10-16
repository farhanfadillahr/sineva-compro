'use client'

import { useEffect, useRef, useState } from 'react'
import { useGsapContext } from '../../lib/motion/gsap'
import { observeVisibility } from '../../lib/motion/in-view'
import { revealPresets } from '../../lib/motion/tokens'
import { useReveal } from '../../lib/motion/use-reveal'
import type { RevealProps } from './Reveal'
import { revealClassName } from './reveal-class'

/** Arm GSAP when the panel is within one viewport height of the screen, not on every page load. */
const ARM_MARGIN = '100% 0px'

/**
 * `rise-scale` for the final CTA panel: it scales from .94 and fades in, and its corners ease from
 * 48 px to the panel's own radius, tied to scroll position (ScrollTrigger `scrub: true`) while the
 * panel enters, with no clock involved.
 *
 * Three layers, so the panel is never stuck hidden:
 * 1. Server HTML is the final state; nothing is hidden without JavaScript.
 * 2. `useReveal` applies the from state before first paint when the panel is below the fold. This
 *    is CSS only and also plays the effect as a one-shot if GSAP never arrives (offline chunk).
 * 3. Once the panel is near the viewport GSAP loads and scrubs the same from/to values, and the
 *    CSS state is released. `fromTo` renders the current scroll position at once, so the hand-over
 *    does not jump.
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
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

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
      className={revealClassName('rise-scale', state, className)}
      style={{ ...style, ...props.style }}
      onTransitionEnd={props.onTransitionEnd}
    >
      {children}
    </Tag>
  )
}
