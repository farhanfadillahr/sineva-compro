'use client'

import { useEffect, useRef, useState } from 'react'
import { observeVisibility } from '@/lib/motion/in-view'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import { frameFor, scrubProgress } from './scroll-scrub-math'

export type ScrollScrubSequenceProps = {
  /** Sprite sheet: `frames` frames of `frameWidth` x `frameHeight`, `cols` per row, left to right. */
  sprite: string
  /** The last frame as its own image: first paint, no-JS and reduced-motion state. */
  poster: string
  frames: number
  cols: number
  frameWidth: number
  frameHeight: number
  className?: string
}

/**
 * A pre-rendered character move scrubbed by the page scroll (motion.md section 4.3): one sprite
 * sheet drawn into a 2D canvas, one frame per scroll position. Scrolling down plays it, scrolling
 * back rewinds it, so the move feels attached to the visitor's hand rather than played at them.
 *
 * Why a sprite on a canvas, not a video: seeking a video on every scroll frame stutters in Safari
 * and needs keyframe-only encodes; drawing a cell of an already decoded image is instant.
 * Why not the realtime GLB: one WebGL canvas per page is the budget (mascot-sino.md section 2).
 *
 * The server HTML and the first client render show the poster (the finished pose), so nothing is
 * missing without JavaScript. The canvas takes over only once the sprite has decoded. The scroll
 * listener is attached only while the element is near the viewport. Reduced motion keeps the
 * poster.
 */
export function ScrollScrubSequence({
  sprite,
  poster,
  frames,
  cols,
  frameWidth,
  frameHeight,
  className,
}: ScrollScrubSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas || prefersReducedMotion()) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let disposed = false
    let raf = 0
    let last = -1
    let listening = false
    const img = new Image()
    img.decoding = 'async'

    const draw = () => {
      raf = 0
      const box = root.getBoundingClientRect()
      const frame = frameFor(scrubProgress(box, window.innerHeight), frames)
      if (frame === last) return
      last = frame
      const sx = (frame % cols) * frameWidth
      const sy = Math.floor(frame / cols) * frameHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    const listen = (on: boolean) => {
      if (on === listening) return
      listening = on
      if (on) {
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })
        onScroll()
      } else {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }

    // The sprite (about 580 KB) is fetched only when the element comes within half a screen of the
    // viewport, so visitors who never reach the section never download it.
    let loaded = false
    let near = false
    img.onload = () => {
      if (disposed) return
      loaded = true
      canvas.width = frameWidth
      canvas.height = frameHeight
      draw()
      setReady(true)
      listen(near)
    }
    const disconnect = observeVisibility(
      root,
      (visible) => {
        near = visible
        if (visible && !img.src) img.src = sprite
        listen(visible && loaded)
      },
      { rootMargin: '50% 0px 50% 0px' },
    )

    return () => {
      disposed = true
      disconnect()
      listen(false)
      if (raf) cancelAnimationFrame(raf)
      img.onload = null
    }
  }, [sprite, frames, cols, frameWidth, frameHeight])

  return (
    <div
      ref={rootRef}
      data-slot="scroll-scrub"
      aria-hidden="true"
      className={className}
      style={{ position: 'relative', aspectRatio: `${frameWidth} / ${frameHeight}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed, pre-sized poster that the canvas replaces in place; next/image would add a wrapper and srcset for one decorative frame */}
      <img
        src={poster}
        alt=""
        width={frameWidth}
        height={frameHeight}
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: ready ? 0 : 1,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: ready ? 1 : 0,
        }}
      />
    </div>
  )
}
