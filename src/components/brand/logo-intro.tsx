'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { INTRO_MARKER_PENDING } from './intro-gate'

// Only a visitor the gate marked ever requests this chunk (and, through it, the Lottie player),
// which keeps the intro out of the network for everyone else (motion.md section 3.1). ssr:false
// because the layer has no server markup: the server-rendered half is LogoIntroShell.
const LogoIntroOverlay = dynamic(
  () => import('./logo-intro-overlay').then((mod) => mod.LogoIntroOverlay),
  { ssr: false },
)

type Phase = 'idle' | 'playing' | 'done'

/**
 * Client takeover of the first-visit logo intro (CPR-76). The decision is not made here: the
 * inline gate script in <head> already ran before first paint and, if the intro should play, marked
 * `<html data-logo-intro="pending">`, which makes the server-rendered shell cover the page. This
 * component only looks for that marker once mounted and, if it is there, plays the Lottie on top of
 * the shell. It renders nothing on the server and on the first client render, so hydration and the
 * SSR HTML are identical with or without the intro.
 *
 * Gotchas:
 * - It never claims the session flag, that is the gate script's job (a reload mid-intro must not
 *   replay it). It never reads settings either.
 * - If this component never mounts or crashes, the marker stays, and the shell hides itself with
 *   CSS at 1.8 s. The shell must never depend on this code to get out of the way.
 * - The layout survives client-side navigation, so this mounts once per full page load and
 *   therefore never plays on in-app navigation.
 */
export function LogoIntro() {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    const pending = document.documentElement.dataset.logoIntro === INTRO_MARKER_PENDING
    // The marker lives outside React (set by the gate script), so it can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase((current) => (current === 'idle' ? (pending ? 'playing' : 'done') : current))
  }, [])

  if (phase !== 'playing') return null
  return <LogoIntroOverlay onDone={() => setPhase('done')} />
}
