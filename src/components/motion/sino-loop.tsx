'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { MediaAsset } from '../../features/content/types'
import { observeVisibility } from '../../lib/motion/in-view'
import { prefersReducedMotion, subscribeToReducedMotion } from '../../lib/motion/reduced-motion'
import { AnimatedPose, type AnimatedPoseProps } from './animated-pose'
import styles from './animated-pose.module.css'
import { pickLoopSource, readLoopEnv, type LoopKind } from './sino-loop-source'
import { SINO_LOOPS, loopPoster, type LoopId, type SinoLoopAsset } from './sino-loops'

export type SinoLoopProps = Omit<AnimatedPoseProps, 'image' | 'media'> & {
  loop: LoopId
  /**
   * The still pose that stands in while the loop's files are not delivered (`ready: false`).
   * Once they are, the loop's own poster takes over as the first paint and the still is unused.
   */
  still: MediaAsset | null
}

type NetworkInformation = EventTarget & { saveData?: boolean }
const connection = (): NetworkInformation | undefined =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformation }).connection

/**
 * Which file to play, or null for "show the poster only". The server snapshot is null, so the
 * server HTML and the first hydration render are the poster image: with JavaScript off, under
 * reduced motion or Save-Data there is never a video element, and a user who will get the video
 * sees the same picture first (the video's poster), so the swap is not visible.
 */
function useLoopKind(): LoopKind | null {
  return useSyncExternalStore(
    (onChange) => {
      const stopMotion = subscribeToReducedMotion(onChange)
      const conn = connection()
      conn?.addEventListener?.('change', onChange)
      return () => {
        stopMotion()
        conn?.removeEventListener?.('change', onChange)
      }
    },
    () => {
      if (prefersReducedMotion() || connection()?.saveData) return null
      const env = readLoopEnv()
      return env ? pickLoopSource(env) : null
    },
    () => null,
  )
}

/** `play()` rejects when autoplay is blocked or the OS is saving power; the poster simply stays. */
function tryPlay(video: HTMLVideoElement) {
  try {
    video.play()?.catch(() => {})
  } catch {
    // Engines that throw instead of rejecting: same outcome, the poster stays.
  }
}

function LoopVideo({
  asset,
  kind,
  fit,
  className,
}: {
  asset: SinoLoopAsset
  kind: LoopKind
  fit: AnimatedPoseProps['fit']
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    // Playing needs both: on screen and tab visible. Either one alone can flip, so the decision
    // is recomputed from the two facts instead of reacting to each event on its own.
    let inView = false
    const sync = () => {
      if (inView && !document.hidden) tryPlay(video)
      else video.pause()
    }
    const stopObserving = observeVisibility(video, (visible) => {
      inView = visible
      sync()
    })
    document.addEventListener('visibilitychange', sync)
    return () => {
      stopObserving()
      document.removeEventListener('visibilitychange', sync)
      video.pause()
    }
  }, [kind])

  return (
    <video
      ref={ref}
      src={asset[kind]}
      poster={asset.poster}
      width={asset.width}
      height={asset.height}
      // Not `autoPlay`: playback is decided by visibility, not by the page loading.
      muted
      playsInline
      loop
      preload="none"
      // Decorative: no controls, so it is not focusable and has no accessible role worth announcing.
      aria-hidden="true"
      disablePictureInPicture
      disableRemotePlayback
      // Same sizing rules as the poster image, so swapping one for the other moves nothing. The
      // explicit ratio holds the box even before the browser maps width/height to an aspect ratio.
      className={[fit === 'contain' ? styles.imageContain : styles.imageNatural, className]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
    />
  )
}

function ReadyLoop({ loop, still: _still, ...pose }: SinoLoopProps) {
  const kind = useLoopKind()
  const asset = SINO_LOOPS[loop]
  const poster = loopPoster(loop)
  // Both branches return the same AnimatedPose at the same position: when the video takes the
  // poster's place React keeps the element, so a reveal that is already running is not restarted.
  return (
    <AnimatedPose
      {...pose}
      image={poster}
      media={
        kind ? (
          <LoopVideo asset={asset} kind={kind} fit={pose.fit} className={pose.imageClassName} />
        ) : undefined
      }
    />
  )
}

/**
 * A Sino pose that plays a short alpha-video loop (mascot-sino.md section 5.1). It is an
 * AnimatedPose whose picture is a `<video>`, so reveal, float, parallax and hover lift are the
 * pose's own and are not repeated here. This file only adds the video rules:
 *
 * - plays only while on screen and the tab is visible, and pauses otherwise (battery, decode cost);
 * - poster first, and poster only under reduced motion or Save-Data (motion.md section 9);
 * - the source is chosen in JS by engine, not by `<source type>` (see pickLoopSource);
 * - not ready (files not delivered yet): draws `still` exactly as a plain AnimatedPose would.
 *
 * Gotchas:
 * - Same as AnimatedPose: do not use it for the LCP image.
 * - The loop is decorative. The poster alt is empty; give the surrounding text the meaning.
 */
export function SinoLoop(props: SinoLoopProps) {
  if (!SINO_LOOPS[props.loop].ready) {
    const { loop: _loop, still, ...pose } = props
    return <AnimatedPose {...pose} image={still} />
  }
  return <ReadyLoop {...props} />
}
