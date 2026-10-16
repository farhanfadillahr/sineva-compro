'use client'

import { useEffect, useRef } from 'react'
import { observeVisibility } from '@/lib/motion/in-view'
import { evaluateSinoGate, readGateEnvironment, whenLoadedAndIdle } from './sino-gate'
import type { SinoRuntime } from './sino-runtime'

export type SinoHeroProps = {
  /** The site setting `enableRealtimeSino`. Off means the poster alone, with no 3D code loaded. */
  enabled?: boolean
}

// Same length as the canvas fade in the runtime (mascot-sino.md section 3: crossfade 300 ms).
const FADE_MS = 300

/**
 * The poster `img` the stage renders under this component. HeroSplit owns that image (it is the
 * SSR LCP element and stays there), so the crossfade reaches it through the stage instead of
 * asking the section for a ref. Looked up lazily: it only matters once a frame has been drawn.
 */
function findPoster(host: HTMLElement): HTMLElement | null {
  return host.closest('[data-slot="sino-stage"]')?.querySelector<HTMLElement>('img') ?? null
}

function setPosterVisible(host: HTMLElement, visible: boolean) {
  const poster = findPoster(host)
  if (!poster) return
  // Opacity only: the poster keeps its box, so the swap cannot shift layout.
  poster.style.transition = `opacity ${FADE_MS}ms var(--ease-out)`
  poster.style.opacity = visible ? '1' : '0'
}

/**
 * The realtime Sino slot for the Home hero (mascot-sino.md sections 2 to 5).
 *
 * Server render: an empty, decorative host. The poster `img` next to it stays the LCP element and
 * no canvas exists. In the browser, after `window.load` plus an idle slot, the loading gate
 * decides; only on a pass is the three.js chunk requested (a plain dynamic `import()` of the
 * runtime module, which is the chunk boundary, so a failed gate downloads none of it).
 *
 * Any failure keeps the poster: a rejected GLB request, a slow device (FPS probe) and a lost
 * WebGL context all end in the same state as never having started.
 */
export function SinoHero({ enabled = true }: SinoHeroProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let runtime: SinoRuntime | null = null
    let stopWatching: (() => void) | null = null

    async function start(target: HTMLElement) {
      try {
        const { startSinoRuntime } = await import('./sino-runtime')
        if (cancelled) return
        const started = await startSinoRuntime({
          host: target,
          onFirstFrame: () => setPosterVisible(target, false),
          onFallback: () => {
            runtime = null
            setPosterVisible(target, true)
          },
        })
        // Unmounted while the GLB was loading: nothing is on screen yet, just release it.
        if (cancelled) started.dispose()
        else runtime = started
      } catch {
        // GLB request failed or the chunk did not load: the poster is already showing.
      }
    }

    function attempt(target: HTMLElement) {
      if (cancelled) return
      const decision = evaluateSinoGate(readGateEnvironment(window, target, enabled))
      if (decision.pass) {
        void start(target)
        return
      }
      // Out of view is the one retryable result (a page restored far down): wait for the hero to
      // appear, then ask again. Every other result is final for this page view.
      if (decision.reason === 'out-of-view') {
        stopWatching = observeVisibility(target, (visible) => {
          if (!visible) return
          stopWatching?.()
          stopWatching = null
          attempt(target)
        })
      }
    }

    const cancelWait = whenLoadedAndIdle(window, () => attempt(host))

    return () => {
      cancelled = true
      cancelWait()
      stopWatching?.()
      runtime?.dispose()
      runtime = null
      // Only touch the poster if this component ever faded it out.
      if (findPoster(host)?.style.opacity === '0') setPosterVisible(host, true)
    }
  }, [enabled])

  return <div ref={hostRef} data-slot="sino-hero-host" className="relative size-full" />
}
