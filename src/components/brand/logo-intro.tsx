'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { INTRO_MARKER_PENDING } from './intro-gate'
import { prepareSplashLaunch, type SplashLaunch } from './splash-launch'

// Only a visitor the gate marked ever requests this chunk (and, through it, the Lottie player),
// which keeps the intro out of the network for everyone else (motion.md section 3.1). ssr:false
// because the layer has no server markup: the server-rendered half is LogoIntroShell.
const LogoIntroOverlay = dynamic(
  () => import('./logo-intro-overlay').then((mod) => mod.LogoIntroOverlay),
  { ssr: false },
)

type Phase = 'idle' | 'playing' | 'done'
type State = { phase: Phase; launch: SplashLaunch | null }

/**
 * Client takeover of the first-visit logo intro (CPR-76). The decision is not made here: the
 * inline gate script in <head> already ran before first paint and, if the intro should play, marked
 * `<html data-logo-intro="pending">`, which makes the server-rendered shell cover the page. This
 * component only looks for that marker once mounted and, if it is there, plays the Lottie on top of
 * the shell. It renders nothing on the server and on the first client render, so hydration and the
 * SSR HTML are identical with or without the intro.
 *
 * The jetpack launch clip is also started from here (splash-launch.ts): this component is in the
 * main bundle and mounts before the overlay chunk exists, so the download overlaps with the chunk
 * and the Lottie instead of queueing behind them. The overlay adopts the element when it is ready.
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
  const [{ phase, launch }, setState] = useState<State>({ phase: 'idle', launch: null })

  useEffect(() => {
    const pending = document.documentElement.dataset.logoIntro === INTRO_MARKER_PENDING
    // Only a document the gate marked ever fetches the clip. Null under reduced motion, webdriver,
    // Save-Data and in a browser with no playable alpha encoding.
    const started = pending ? prepareSplashLaunch() : null
    // The marker lives outside React (set by the gate script), so it can only be read after mount.
    // StrictMode runs this effect twice in development; the cleanup below drops the first clip, so
    // the second run's state is the one that must win.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ phase: pending ? 'playing' : 'done', launch: started })
    return () => started?.dispose()
  }, [])

  if (phase !== 'playing') return null
  return (
    <LogoIntroOverlay
      launch={launch}
      onDone={() => setState((current) => ({ ...current, phase: 'done' }))}
    />
  )
}
