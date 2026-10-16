'use client'

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react'
import { observeVisibility } from '../../lib/motion/in-view'
import { prefersReducedMotion, usePrefersReducedMotion } from '../../lib/motion/reduced-motion'
import { parallaxOffset, scrollParallaxOffset } from './animated-pose-math'
import styles from './Parallax.module.css'

type ParallaxOwnProps = {
  /**
   * - `top`: for a visual on screen at load (a hero). The offset follows the page scroll and is
   *   zero at the top, so nothing jumps when the script starts.
   * - `centre`: for a visual further down. The offset follows its distance from the viewport
   *   centre, and scroll is only listened to while the block is in view.
   */
  mode?: 'top' | 'centre'
}

export type ParallaxProps = ParallaxOwnProps & ComponentPropsWithoutRef<'div'>

/**
 * Drifts its children against the scroll at 0.92x, clamped to +-24 px (mascot-sino.md section
 * 5.1, the same numbers as AnimatedPose). For visuals that are not Sino poses: hero images and
 * phone mockups. Poses use AnimatedPose, which carries this effect itself; do not nest the two.
 *
 * Why two elements: the offset is measured on the outer box, which never moves. Measuring the
 * transformed element would feed its own offset back into the next measurement.
 *
 * Gotchas:
 * - Transform only, passive listeners, one rAF per burst of scroll events. No layout reads on
 *   scroll except the outer box in `centre` mode.
 * - Never put this inside a `position: sticky` column or around the LCP element's reveal: it moves
 *   the visual, it does not hide or delay it.
 * - Reduced motion: no listener at all, and the stylesheet drops the transform as a safety net.
 */
export function Parallax({ mode = 'centre', className, children, ...rest }: ParallaxProps) {
  const outer = useRef<HTMLDivElement | null>(null)
  const layer = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const box = outer.current
    const node = layer.current
    // Read the live preference: during hydration `reduced` still holds the server's `false`.
    if (!box || !node || reduced || prefersReducedMotion()) return

    let frame = 0
    // The server markup is at offset 0, so 0 needs no write.
    let last = '0px'
    const measure = () => {
      frame = 0
      const offset =
        mode === 'top'
          ? scrollParallaxOffset(window.scrollY)
          : parallaxOffset(box.getBoundingClientRect(), window.innerHeight)
      const value = `${offset}px`
      if (value === last) return
      last = value
      node.style.setProperty('--parallax-y', value)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    let listening = false
    const start = () => {
      if (listening) return
      listening = true
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule, { passive: true })
      schedule()
    }
    const stop = () => {
      if (!listening) return
      listening = false
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    let stopObserving = () => {}
    if (mode === 'top') start()
    else stopObserving = observeVisibility(box, (visible) => (visible ? start() : stop()))

    return () => {
      stopObserving()
      stop()
      // Leave the DOM as the server rendered it.
      node.style.removeProperty('--parallax-y')
    }
  }, [mode, reduced])

  return (
    <div {...rest} ref={outer} data-parallax={mode} className={className}>
      <div ref={layer} data-slot="parallax-layer" className={styles.layer}>
        {children}
      </div>
    </div>
  )
}
