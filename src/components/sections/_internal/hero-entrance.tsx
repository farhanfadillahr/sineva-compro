'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { dur } from '@/lib/motion/tokens'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'

// Hero entrance (docs/design/motion.md section 3.2). The server renders every element in its
// final state, so visitors without JavaScript, crawlers and the LCP paint all see the finished
// hero. On the client this component finds the elements the server marked with `data-hero-delay`
// and `data-hero-from`, puts them in the from-state in a layout effect, then lets one frame pass
// and releases them with a CSS transition. CSS transitions rather than GSAP on purpose: the hero
// is the first thing on the page and the animation-library budget is spent only when the sticky
// steps come into view (accessibility-performance.md section 2).
//
// Gotcha: a layout effect only runs after hydration, so on a slow connection the server HTML is
// visible for a moment, then snaps to the from-state and animates. That flash is the cost of
// "never hide content with CSS that only JavaScript can reveal" and is accepted in motion.md.

const FROM_TRANSFORM = {
  'rise-16': 'translateY(16px)',
  'rise-12': 'translateY(12px)',
  scale: 'scale(0.92)',
} as const
export type HeroFrom = keyof typeof FROM_TRANSFORM

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function HeroEntrance({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const root = ref.current
    // Read the live preference: reduced motion keeps the server state untouched (no-op).
    if (!root || prefersReducedMotion()) return
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-delay]'))
    if (steps.length === 0) return

    const reset = () => {
      for (const el of steps) {
        el.style.opacity = ''
        el.style.transform = ''
        el.style.transition = ''
        el.style.willChange = ''
      }
    }

    for (const el of steps) {
      const from = el.getAttribute('data-hero-from') as HeroFrom | null
      el.style.opacity = '0'
      el.style.transform = FROM_TRANSFORM[from ?? 'rise-12'] ?? FROM_TRANSFORM['rise-12']
    }
    // Commit the from-state before the transition is armed, or the browser would skip it.
    void root.offsetHeight

    let settle: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      let longest = 0
      for (const el of steps) {
        const delay = Number(el.getAttribute('data-hero-delay') ?? 0)
        longest = Math.max(longest, delay)
        // The stage pops with a small overshoot; text and CTAs rise with the expo ease-out.
        const ease = el.getAttribute('data-hero-from') === 'scale' ? 'bounce' : 'out-expo'
        const timing = `var(--dur-slow) var(--ease-${ease}) ${delay}ms`
        el.style.transition = `opacity ${timing}, transform ${timing}`
        el.style.willChange = 'opacity, transform'
        el.style.opacity = ''
        el.style.transform = ''
      }
      // will-change only while animating (motion.md section 10).
      settle = setTimeout(reset, longest + dur.slow + 100)
    })

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
      reset()
    }
  }, [])

  // `contents` keeps the wrapper out of the layout: the Split grid sees its real children.
  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  )
}
