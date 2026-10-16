'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { INTRO_MARKER_PENDING } from './intro-gate'
import { prepareSplashLaunch, splashAllowed, type SplashLaunch } from './splash-launch'
import { msUntil, SPLASH_TIMING } from './splash-sequence'

// Only a visitor the gate marked ever requests this chunk, which keeps the splash out of the
// network for everyone else (motion.md section 3.1). ssr:false because the layer has no server
// markup: the server-rendered half is LogoIntroShell.
const LogoIntroOverlay = dynamic(
  () => import('./logo-intro-overlay').then((mod) => mod.LogoIntroOverlay),
  { ssr: false },
)

type Phase = 'idle' | 'playing' | 'done'
type State = { phase: Phase; launch: SplashLaunch | null }

const releaseMarker = () => {
  const html = document.documentElement
  if (html.dataset.logoIntro === INTRO_MARKER_PENDING) delete html.dataset.logoIntro
}

/**
 * Client takeover of the first-load splash. The decision is not made here: the inline gate script
 * in <head> already ran before first paint and, if the splash should play, marked
 * `<html data-logo-intro="pending">`, which makes the server-rendered shell cover the page. This
 * component only looks for that marker once mounted and, if it is there, mounts the overlay that
 * plays the clip and wipes the page open. It renders nothing on the server and on the first client
 * render, so hydration and the SSR HTML are identical with or without the splash.
 *
 * The clip download is started from here (splash-launch.ts): this component is in the main bundle
 * and mounts before the overlay chunk exists, so the download overlaps with the chunk instead of
 * queueing behind it. The overlay adopts the element.
 *
 * Gotchas:
 * - Save-Data and reduced motion mean no splash, but the gate script cannot read Save-Data (it is
 *   byte-stable, one CSP hash). So a Save-Data visitor sees the blank shell from first paint until
 *   this effect runs, which releases the page at once. That gap is the cost of the stable script.
 * - It never reads settings; the gate did.
 * - If the overlay chunk never loads, the marker stays and the shell covers the page. This
 *   component therefore releases the marker at the 5 s hard stop itself, and the shell hides
 *   itself with CSS at the same time even if no JavaScript runs.
 * - The layout survives client-side navigation, so this mounts once per full page load and
 *   therefore never plays on in-app navigation.
 */
export function LogoIntro() {
  const [{ phase, launch }, setState] = useState<State>({ phase: 'idle', launch: null })

  useEffect(() => {
    const pending = document.documentElement.dataset.logoIntro === INTRO_MARKER_PENDING
    if (!pending || !splashAllowed()) {
      if (pending) releaseMarker()
      // The marker lives outside React (set by the gate script), so it can only be read after
      // mount; this is the one place it enters React state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ phase: 'done', launch: null })
      return
    }
    // Null only when the browser has no playable alpha encoding: the splash then runs without Sino.
    const started = prepareSplashLaunch()
    // StrictMode runs this effect twice in development; the cleanup below drops the first clip, so
    // the second run's state is the one that must win.
    setState({ phase: 'playing', launch: started })
    const chunkGuard = setTimeout(
      () => {
        releaseMarker()
        setState((current) => ({ ...current, phase: 'done' }))
      },
      msUntil(SPLASH_TIMING.hardStopMs, performance.now()),
    )
    return () => {
      clearTimeout(chunkGuard)
      started?.dispose()
    }
  }, [])

  if (phase !== 'playing') return null
  return (
    <LogoIntroOverlay
      launch={launch}
      onDone={() => setState((current) => ({ ...current, phase: 'done' }))}
    />
  )
}
