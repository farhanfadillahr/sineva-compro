import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { isInViewport, observeVisibility, supportsIntersectionObserver } from './in-view'
import { prefersReducedMotion, usePrefersReducedMotion } from './reduced-motion'
import { splitIntoLines, type LineSplit } from './split-lines'
import { joinStaggerBatch } from './stagger-batch'
import { revealDefaults, revealPresets, stagger, type RevealVariant } from './tokens'

/**
 * - idle:   final state. What the server renders, what users without JS see, and what elements
 *           already in view (or reduced-motion users) keep.
 * - hidden: the `from` state of the variant (24 px down for `rise`, line masks closed for `lines`,
 *           and so on). Only ever set on the client, before first paint, for elements below the
 *           fold.
 * - shown:  transitioning to (or at) the final state. Terminal: play once.
 * - done:   transition finished; will-change dropped.
 */
export type RevealState = 'idle' | 'hidden' | 'shown' | 'done'

/** Delay for the nth sibling: 50 ms steps, the sixth and every later item start together. */
export function revealDelayMs(index: number, stepMs: number = stagger.stepMs): number {
  const step = Math.min(stagger.maxStepMs, Math.max(stagger.minStepMs, stepMs))
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  return Math.min(i, stagger.maxItems - 1) * step
}

// Layout effects do not run on the server; useEffect there only keeps tooling quiet about it.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** How long a variant keeps animating after its start delay, plus slack for the last frame. */
const SETTLE_SLACK_MS = 120

/**
 * The transition whose end settles the element. Variants with two transitions of different
 * lengths (clip: opacity 500 ms, clip-path 900 ms) must wait for the longer one, or the clip would
 * be dropped mid-wipe. `null`: the wrapper itself does not transition (its children do), so only
 * the timer settles it. `undefined`: any transition on the element.
 */
const SETTLE_PROPERTY: Record<RevealVariant, string | null | undefined> = {
  rise: undefined,
  lines: null,
  depth: 'transform',
  clip: 'clip-path',
  'rise-scale': undefined,
}

/** Wall-clock time an element needs after it is shown, as a backstop for a missing transitionend. */
export function revealSettleMs(variant: RevealVariant, delayMs: number, lineCount = 1): number {
  const p = revealPresets
  let run: number
  switch (variant) {
    case 'lines':
      run = Math.max(
        p.lines.durationMs + p.lines.lineStepMs * (Math.max(1, lineCount) - 1),
        p.lines.partDelayMs + p.lines.partDurationMs,
      )
      break
    case 'depth':
      run = p.depth.durationMs
      break
    case 'clip':
      run = p.clip.durationMs
      break
    default:
      run = p.rise.durationMs
  }
  return delayMs + run + SETTLE_SLACK_MS
}

/** Trailing-edge debounce for the line re-split on resize. */
const RESIZE_DEBOUNCE_MS = 150

export type UseRevealOptions = {
  /** Which scroll preset the element plays. Default `rise`. */
  variant?: RevealVariant
  /**
   * The element sits inside another reveal that already moves it (a pose inside a card): it takes
   * the final state instead of animating a second time on top of its parent.
   */
  nested?: boolean
  /** Position among siblings, drives the stagger. */
  index?: number
  /** Explicit delay in ms; wins over `index`. */
  delayMs?: number
  stepMs?: number
  threshold?: number
}

export function useReveal<T extends HTMLElement = HTMLElement>({
  variant = 'rise',
  nested = false,
  index,
  delayMs,
  stepMs,
  threshold = revealDefaults.threshold,
}: UseRevealOptions = {}) {
  const ref = useRef<T | null>(null)
  const [state, setState] = useState<RevealState>('idle')
  // Stagger by arrival for `depth`, resolved when the batch of cards closes.
  const [batchDelay, setBatchDelay] = useState(0)
  const stopRef = useRef<(() => void) | null>(null)
  // Mirror of `state` for the effect below, which must read it without re-running on every change.
  const stateRef = useRef(state)
  const reduced = usePrefersReducedMotion()

  useIsoLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  useIsoLayoutEffect(() => {
    const el = ref.current
    // Read the live preference rather than `reduced`: during hydration the hook still reports its
    // server snapshot (false), and acting on that would flash the from state at reduced-motion users.
    if (!el || reduced || prefersReducedMotion()) {
      setState('idle')
      return
    }
    if (stateRef.current === 'shown' || stateRef.current === 'done') return
    if (!supportsIntersectionObserver()) return
    // A parent reveal already moves this element; animating it again would be a double motion.
    if (nested && el.parentElement?.closest('[data-reveal]')) {
      setState('idle')
      return
    }
    if (isInViewport(el.getBoundingClientRect(), window.innerHeight, threshold)) {
      setState('idle')
      return
    }
    // Runs before paint, so there is no frame where the block is visible and then vanishes.
    setState('hidden')
    let cancelBatch: (() => void) | null = null
    const stopObserving = observeVisibility(
      el,
      (visible) => {
        if (!visible) return
        // Play once: release the observer now instead of waiting for unmount.
        stopObserving()
        if (variant === 'depth') {
          cancelBatch = joinStaggerBatch(el, (d) => {
            cancelBatch = null
            setBatchDelay(d)
            setState('shown')
          })
        } else {
          setState('shown')
        }
      },
      { threshold },
    )
    const stop = () => {
      stopObserving()
      cancelBatch?.()
      cancelBatch = null
    }
    stopRef.current = stop
    return () => {
      stop()
      if (stopRef.current === stop) stopRef.current = null
    }
  }, [reduced, threshold, variant, nested])

  const baseDelay = delayMs ?? (index === undefined ? 0 : revealDelayMs(index, stepMs))
  // `depth` staggers by arrival instead of by list position; an explicit delay still applies.
  const delay = variant === 'depth' ? (delayMs ?? 0) + batchDelay : baseDelay

  // Lines: split the title while the block waits and plays, put the original text back when done.
  // `active` stays true from hidden through shown, so the split survives the state change and the
  // transition runs on the very nodes that were painted hidden.
  const linesActive = variant === 'lines' && (state === 'hidden' || state === 'shown')
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!linesActive || !el) return
    const title =
      el.querySelector<HTMLElement>('[data-reveal-part="title"]') ??
      el.querySelector<HTMLElement>('h1, h2, h3')
    if (!title) return
    let split: LineSplit | null = splitIntoLines(title)
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastWidth: number | null = null
    // Fonts decide where lines break, and the web font usually arrives after hydration.
    const resplit = () => {
      if (stateRef.current !== 'hidden') return
      split?.revert()
      split = splitIntoLines(title)
    }
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(resplit, RESIZE_DEBOUNCE_MS)
    }
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver((entries) => {
        const width = entries[entries.length - 1]?.contentRect.width
        if (width === undefined) return
        // The first callback is the initial measurement, and a height-only change re-flows nothing.
        const changed = lastWidth !== null && Math.abs(width - lastWidth) >= 1
        lastWidth = width
        if (changed) schedule()
      })
      ro.observe(el)
    }
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (!cancelled) schedule()
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      ro?.disconnect()
      split?.revert()
    }
  }, [linesActive])

  // Backstop for a transitionend that never comes (display: none ancestor, interrupted style).
  useEffect(() => {
    if (state !== 'shown') return
    const lines = ref.current?.querySelectorAll('[data-line]').length ?? 1
    const timer = setTimeout(
      () => setState((s) => (s === 'shown' ? 'done' : s)),
      revealSettleMs(variant, delay, lines),
    )
    return () => clearTimeout(timer)
  }, [state, variant, delay])

  const onTransitionEnd = useCallback(
    (e: { target: EventTarget; currentTarget: EventTarget; propertyName?: string }) => {
      // Transitions on descendants bubble up; only the block's own end settles it.
      if (e.target !== e.currentTarget) return
      const wanted = SETTLE_PROPERTY[variant]
      if (wanted === null) return
      if (wanted !== undefined && e.propertyName !== undefined && e.propertyName !== wanted) return
      setState((s) => (s === 'shown' ? 'done' : s))
    },
    [variant],
  )

  /** Hand the element to another driver (GSAP scrub): drop the CSS from state for good. */
  const release = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setState('done')
  }, [])

  const style = (delay > 0 ? { '--reveal-delay': `${delay}ms` } : undefined) as
    CSSProperties | undefined

  return {
    ref,
    state,
    release,
    props: { 'data-reveal': state, 'data-reveal-variant': variant, style, onTransitionEnd },
  }
}
