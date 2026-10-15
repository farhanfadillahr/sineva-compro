'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { observeVisibility } from '../../lib/motion/in-view'
import { fetchLottieData, loadLottie, type LottieAnimation } from '../../lib/motion/lottie'
import { prefersReducedMotion, subscribeToReducedMotion } from '../../lib/motion/reduced-motion'
import styles from './LottiePlayer.module.css'

type Dimension = number | string

/** The box must be reserved up front or the page shifts when the SVG arrives (CLS budget: 0.1). */
type LottieSize =
  | { width: Dimension; height: Dimension; aspectRatio?: Dimension }
  | { aspectRatio: Dimension; width?: Dimension; height?: Dimension }

export type LottiePlayerProps = LottieSize & {
  /** Public URL of the animation JSON, e.g. /lottie/sineva-symbol-intro.json. */
  src: string
  /** Loop while on screen. Ignored under reduced motion. */
  loop?: boolean
  /** One play-through, never replayed (default). `false` replays on each re-entry after finishing. */
  playOnce?: boolean
  /** Fires when a non-looping animation reaches its last frame. */
  onComplete?: () => void
  /** Makes the animation an image for assistive tech. Decorative (aria-hidden) when omitted. */
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}

/**
 * Lottie animation that costs nothing until it is on screen: the light player and the JSON are
 * requested when the box first becomes visible. It plays while visible in a visible tab, pauses
 * otherwise, and under reduced motion renders the last frame as a still.
 *
 * Gotchas:
 * - `src` is fetched with `fetch`, so it must be same-origin or CORS-enabled (CSP connect-src).
 * - A failed load leaves the reserved box empty (`data-lottie-state="error"`); it is not retried.
 * - Reduced motion is honoured live: turning it on mid-playback pauses on the final frame.
 */
export function LottiePlayer({
  src,
  loop = false,
  playOnce = true,
  onComplete,
  ariaLabel,
  className,
  style,
  width,
  height,
  aspectRatio,
}: LottiePlayerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const controller = new AbortController()
    let disposed = false
    let started = false
    let anim: LottieAnimation | undefined
    let inView = false
    let tabVisible = document.visibilityState !== 'hidden'
    let reduced = prefersReducedMotion()
    let completed = false
    let playing = false

    const showFinalFrame = () => {
      if (!anim) return
      const current = anim
      const jump = () => current.goToAndStop(current.totalFrames - 1, true)
      // With inline data the file is normally ready synchronously, but images or fonts inside the
      // JSON delay it, and seeking before DOMLoaded is silently ignored.
      if (current.isLoaded) jump()
      else current.addEventListener('DOMLoaded', jump)
    }

    // Single decision point for play/pause so visibility, tab and completion cannot disagree.
    const sync = () => {
      if (!anim || reduced) return
      const wantPlaying = inView && tabVisible && !completed
      if (wantPlaying && !playing) {
        anim.play()
        playing = true
      } else if (!wantPlaying && playing) {
        anim.pause()
        playing = false
      }
    }

    const load = async () => {
      box.dataset.lottieState = 'loading'
      try {
        const [lottie, data] = await Promise.all([
          loadLottie(),
          fetchLottieData(src, controller.signal),
        ])
        if (disposed) return
        anim = lottie.loadAnimation({
          container: box,
          renderer: 'svg',
          loop: loop && !reduced,
          autoplay: false,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        })
        anim.addEventListener('complete', () => {
          completed = true
          playing = false
          onCompleteRef.current?.()
        })
        box.dataset.lottieState = 'ready'
        if (reduced) showFinalFrame()
        else sync()
      } catch {
        // Decorative enhancement: a missing file or chunk must not break the page.
        if (!disposed) box.dataset.lottieState = 'error'
      }
    }

    const stopObserving = observeVisibility(box, (visible) => {
      inView = visible
      if (visible && !started) {
        started = true
        void load()
        return
      }
      if (!anim) return
      if (visible && completed && !playOnce && !loop && !reduced) {
        completed = false
        playing = true
        anim.goToAndPlay(0, true)
        return
      }
      sync()
    })

    const onVisibilityChange = () => {
      tabVisible = document.visibilityState !== 'hidden'
      sync()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const stopReducedMotion = subscribeToReducedMotion(() => {
      reduced = prefersReducedMotion()
      if (!anim) return
      if (reduced) {
        anim.pause()
        playing = false
        showFinalFrame()
      } else {
        sync()
      }
    })

    return () => {
      disposed = true
      controller.abort()
      stopObserving()
      stopReducedMotion()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      anim?.destroy()
      delete box.dataset.lottieState
    }
  }, [src, loop, playOnce])

  const hasLabel = ariaLabel !== undefined && ariaLabel !== ''
  return (
    <div
      ref={boxRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ width, height, aspectRatio, ...style }}
      aria-hidden={hasLabel ? undefined : true}
      role={hasLabel ? 'img' : undefined}
      aria-label={hasLabel ? ariaLabel : undefined}
    />
  )
}
