'use client'

import Image from 'next/image'
import { useEffect, useId, type ComponentPropsWithoutRef, type CSSProperties } from 'react'
import type { MediaAsset } from '../../features/content/types'
import { observeVisibility } from '../../lib/motion/in-view'
import { prefersReducedMotion, usePrefersReducedMotion } from '../../lib/motion/reduced-motion'
import { useReveal } from '../../lib/motion/use-reveal'
import {
  parallaxOffset,
  parityOfId,
  phaseForIndex,
  tiltForIndex,
  type Phase,
  type Tilt,
} from './animated-pose-math'
import styles from './animated-pose.module.css'

/** Half of the 6 s float cycle: the odd phase starts mid-swing. */
const FLOAT_PERIOD_S = 6

/**
 * The nearest "card" a pose belongs to. Hover and focus on it drive the lift, and its box is what
 * the parallax is measured against. An explicit `data-pose-host` wins; Sino stages count as a card
 * for the stills that sit alone on one. With none of these around, the pose is its own host.
 */
const HOST_SELECTOR = '[data-pose-host], article, li, [data-slot="sino-stage"]'

export type AnimatedPoseProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /** The still. Renders nothing for `null`, so a pose without an exported file leaves no hole. */
  image: MediaAsset | null
  sizes: string
  /** Position among siblings. Drives float phase, tilt direction and the reveal stagger. */
  index?: number
  /** Float phase; wins over `index`. 0 starts at rest, 1 starts half a cycle in. */
  phase?: Phase
  /** Hover tilt direction (1 clockwise, -1 counter-clockwise); wins over `index`. */
  tilt?: Tilt
  /** Extra delay in ms before the reveal starts, for example to follow the card's own reveal. */
  delayMs?: number
  /**
   * `natural`: width 100%, height from the aspect ratio. `contain`: fill the box the caller
   * sized and fit the still inside it (stages, fixed-height covers).
   */
  fit?: 'natural' | 'contain'
  /** Extra class on the `<img>`. Layout classes belong on `className` (the outer box). */
  imageClassName?: string
}

/**
 * A Sino pose still that moves (mascot-sino.md section 5.1): reveals on scroll, floats while in
 * view, drifts against the scroll at 0.92x, and lifts and tilts when its card is hovered or
 * keyboard-focused. CSS and IntersectionObserver only: no GSAP, no canvas.
 *
 * Why the DOM is written directly instead of through React state: scroll and hover happen many
 * times a second and must never re-render the tree. The effect below sets data attributes and CSS
 * variables on the existing nodes; the stylesheet turns them into motion. React never renders
 * those attributes, so it never overwrites them.
 *
 * Gotchas:
 * - The server HTML carries no motion attribute: with JavaScript off, or under reduced motion, the
 *   pose is the plain final image. Only reveal can ever hide it, and only on the client, before
 *   first paint (useReveal).
 * - Do not use this for the LCP image. Reveal would delay it; the hero poster stays a plain
 *   priority image.
 * - `pointer-events: none` on the pose's own box is fine: hover is read from the card, not the pose.
 */
export function AnimatedPose({
  image,
  sizes,
  index,
  phase,
  tilt,
  delayMs,
  fit = 'natural',
  imageClassName,
  className,
  style,
  ...rest
}: AnimatedPoseProps) {
  const reduced = usePrefersReducedMotion()
  // Without an index, derive a stable 0 or 1 from the id: same on the server and in the browser.
  const fallback = parityOfId(useId())
  const position = index ?? fallback
  const resolvedPhase = phase ?? phaseForIndex(position)
  const resolvedTilt = tilt ?? tiltForIndex(position)

  const { ref, state, props: reveal } = useReveal<HTMLDivElement>({ index, delayMs })

  useEffect(() => {
    const root = ref.current
    // Read the live preference: during hydration `reduced` still holds the server's `false`.
    if (!root || reduced || prefersReducedMotion()) return

    const host = root.closest<HTMLElement>(HOST_SELECTOR) ?? root

    // Hover and keyboard focus are tracked apart: leaving with the mouse must not drop a pose
    // whose card still holds keyboard focus.
    let hovered = false
    let focused = false
    const render = () => {
      const active = hovered || focused
      root.dataset.active = String(active)
      // The stage glow reads this inherited variable (sino-stage.module.css).
      host.style.setProperty('--pose-glow', active ? '1' : '0')
    }
    const onEnter = (e: Event) => {
      // A tap fires pointerenter and never a leave, which would leave the pose stuck lifted.
      if ((e as PointerEvent).pointerType === 'touch') return
      hovered = true
      render()
    }
    const onLeave = () => {
      hovered = false
      render()
    }
    const onFocusIn = (e: Event) => {
      let visible = true
      try {
        // Only keyboard-style focus counts; a mouse click on the card's link must not lift it twice.
        visible = (e.target as Element).matches(':focus-visible')
      } catch {
        // Engines without :focus-visible: treat any focus as visible rather than never reacting.
      }
      if (!visible) return
      focused = true
      render()
    }
    const onFocusOut = (e: Event) => {
      // Focus moving between two controls of the same card is not leaving the card.
      if (host.contains((e as FocusEvent).relatedTarget as Node | null)) return
      focused = false
      render()
    }
    host.addEventListener('pointerenter', onEnter)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('focusin', onFocusIn)
    host.addEventListener('focusout', onFocusOut)

    // Parallax: one rAF per burst of scroll events, and only between in-view and out-of-view.
    let frame = 0
    let last = ''
    const measure = () => {
      frame = 0
      const value = `${parallaxOffset(host.getBoundingClientRect(), window.innerHeight)}px`
      if (value === last) return
      last = value
      root.style.setProperty('--pose-parallax', value)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    let listening = false
    const startScroll = () => {
      if (listening) return
      listening = true
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule, { passive: true })
      schedule()
    }
    const stopScroll = () => {
      if (!listening) return
      listening = false
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    const stopObserving = observeVisibility(root, (visible) => {
      root.dataset.inview = String(visible)
      if (visible) startScroll()
      else stopScroll()
    })

    return () => {
      stopObserving()
      stopScroll()
      host.removeEventListener('pointerenter', onEnter)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('focusin', onFocusIn)
      host.removeEventListener('focusout', onFocusOut)
      // Leave the DOM as the server rendered it, so a flip to reduced motion (or an unmount that
      // keeps the host) leaves no variable or attribute behind to fight the static rules.
      delete root.dataset.active
      delete root.dataset.inview
      root.style.removeProperty('--pose-parallax')
      host.style.removeProperty('--pose-glow')
    }
  }, [ref, reduced])

  if (!image) return null

  const rootStyle = {
    ...style,
    ...reveal.style,
    '--pose-float-delay': `${resolvedPhase === 0 ? 0 : -FLOAT_PERIOD_S / 2}s`,
    '--pose-tilt': String(resolvedTilt),
  } as CSSProperties

  return (
    <div
      {...rest}
      ref={ref}
      data-animated-pose=""
      data-reveal={state}
      data-phase={resolvedPhase}
      data-motion={reduced ? 'static' : undefined}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={rootStyle}
      // The reveal is a keyframe animation, so its end arrives as animationend, not transitionend.
      onAnimationEnd={reveal.onTransitionEnd}
    >
      <div className={styles.parallax}>
        <div className={styles.float}>
          <div className={styles.lift}>
            <Image
              src={image.url}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes={sizes}
              placeholder={image.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={image.blurDataUrl ?? undefined}
              className={[
                fit === 'contain' ? styles.imageContain : styles.imageNatural,
                imageClassName,
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
