'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { claimSessionOnce } from '@/lib/motion/session'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import { INTRO_SESSION_KEY, shouldPlayIntro } from './intro-gate'

// Only a first-time visitor ever requests this chunk (and, through it, the Lottie player), which
// keeps the intro out of the bundle and the network for everyone else (motion.md section 3.1).
// ssr:false because the overlay has no server markup by design.
const LogoIntroOverlay = dynamic(
  () => import('./logo-intro-overlay').then((mod) => mod.LogoIntroOverlay),
  { ssr: false },
)

type Phase = 'idle' | 'playing' | 'done'

/**
 * First-visit logo intro (CPR-76). Renders nothing on the server and on the first client render,
 * so the SSR HTML, hydration and the LCP candidate (the hero) are identical with or without the
 * intro. Everything that decides whether to play needs the browser (sessionStorage, matchMedia,
 * navigator.webdriver), so it happens in an effect after mount.
 *
 * `force` is wired to the server env `LOGO_INTRO_FORCE=1` in the public layout. The layout is
 * prerendered, so the value is fixed at build time: set it only when building for Lighthouse or
 * Playwright, never in a deployed build. It lifts the `navigator.webdriver` rule and nothing else.
 *
 * Gotchas:
 * - Reduced motion is read imperatively at mount. `usePrefersReducedMotion` reports false until
 *   after hydration, which would let the overlay flash for one frame for exactly the people who
 *   asked for no motion.
 * - The session slot is claimed on every decision, including the ones that say no. The slot means
 *   "this session had its chance"; a reduced-motion or automated visit that never plays still must
 *   not play later in the same session.
 * - The layout survives client-side navigation, so this mounts once per full page load and
 *   therefore never plays on in-app navigation.
 */
export function LogoIntro({ enabled, force = false }: { enabled: boolean; force?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle')
  // StrictMode runs effects twice in development; the second run must reuse the first answer
  // instead of finding the slot already claimed.
  const decision = useRef<boolean | null>(null)

  useEffect(() => {
    decision.current ??= shouldPlayIntro({
      enabled,
      force,
      reducedMotion: prefersReducedMotion(),
      webdriver: typeof navigator !== 'undefined' && navigator.webdriver === true,
      visited: !claimSessionOnce(INTRO_SESSION_KEY),
    })
    const play = decision.current
    // The decision reads browser-only state, so it cannot happen during render.
    setPhase((current) => (current === 'idle' ? (play ? 'playing' : 'done') : current))
  }, [enabled, force])

  if (phase !== 'playing') return null
  return <LogoIntroOverlay onDone={() => setPhase('done')} />
}
