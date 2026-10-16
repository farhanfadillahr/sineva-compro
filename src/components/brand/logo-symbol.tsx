'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LottiePlayer } from '@/components/motion/LottiePlayer'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import { SYMBOL_LOTTIE_SRC } from './intro-gate'
import { observeLottieState } from './lottie-state'
import { createReplayThrottle } from './replay-throttle'

const REPLAY_WINDOW_MS = 10_000
// The symbol Lottie lasts 1 s; this only matters if the player never reports completion.
const REPLAY_GIVE_UP_MS = 1_500
// Desktop only: touch has no hover, and a tap that replays an animation before navigating is noise.
const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)'

function finePointerAvailable(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(FINE_HOVER_QUERY).matches
}

/**
 * The logo symbol. The default render is the static SVG, exactly what the server sends. With
 * `replayOnHover` it additionally replays the symbol Lottie (L2, motion.md section 7) when the
 * pointer enters the surrounding link, at most once per 10 s, on desktop pointers, never under
 * reduced motion.
 *
 * Gotchas:
 * - The listener sits on the closest link, not on the 28 px symbol, so hovering the wordmark
 *   replays it too; with no link around it falls back to the symbol itself.
 * - The static image stays visible until the player reports ready, so a slow first fetch never
 *   blinks the logo out. It is hidden with opacity (keeps layout) and restored when the replay
 *   ends, fails, or the give-up timer fires.
 */
export function LogoSymbol({
  src,
  size = 28,
  replayOnHover = false,
}: {
  src: string
  size?: number
  replayOnHover?: boolean
}) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const layerRef = useRef<HTMLSpanElement>(null)
  const [replaying, setReplaying] = useState(false)
  const [ready, setReady] = useState(false)
  const replayingRef = useRef(false)
  const take = useRef<(() => boolean) | null>(null)

  const end = useCallback(() => {
    replayingRef.current = false
    setReplaying(false)
    setReady(false)
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!replayOnHover || !wrapper) return
    take.current ??= createReplayThrottle(REPLAY_WINDOW_MS)
    const host: Element = wrapper.closest('a') ?? wrapper

    const onEnter = (event: Event) => {
      if ((event as PointerEvent).pointerType === 'touch') return
      if (replayingRef.current || prefersReducedMotion() || !finePointerAvailable()) return
      if (!take.current?.()) return
      replayingRef.current = true
      setReplaying(true)
    }
    host.addEventListener('pointerenter', onEnter)
    return () => host.removeEventListener('pointerenter', onEnter)
  }, [replayOnHover])

  useEffect(() => {
    const layer = layerRef.current
    if (!replaying || !layer) return
    const giveUp = setTimeout(end, REPLAY_GIVE_UP_MS)
    const stop = observeLottieState(layer, (state) => {
      if (state === 'ready') setReady(true)
      else if (state === 'error') end()
    })
    return () => {
      clearTimeout(giveUp)
      stop()
    }
  }, [replaying, end])

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        className="shrink-0"
        style={ready ? { opacity: 0 } : undefined}
      />
      {replaying ? (
        <span ref={layerRef} aria-hidden="true" className="absolute inset-0 block">
          <LottiePlayer
            src={SYMBOL_LOTTIE_SRC}
            playOnce
            width={size}
            height={size}
            onComplete={end}
          />
        </span>
      ) : null}
    </span>
  )
}
