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
import { revealDefaults, stagger } from './tokens'

/**
 * - idle:   final state. What the server renders, what users without JS see, and what elements
 *           already in view (or reduced-motion users) keep.
 * - hidden: the `from` state (24 px down, transparent). Only ever set on the client, before
 *           first paint, for elements below the fold.
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

export type UseRevealOptions = {
  /** Position among siblings, drives the stagger. */
  index?: number
  /** Explicit delay in ms; wins over `index`. */
  delayMs?: number
  stepMs?: number
  threshold?: number
}

export function useReveal<T extends HTMLElement = HTMLElement>({
  index,
  delayMs,
  stepMs,
  threshold = revealDefaults.threshold,
}: UseRevealOptions = {}) {
  const ref = useRef<T | null>(null)
  const [state, setState] = useState<RevealState>('idle')
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
    if (isInViewport(el.getBoundingClientRect(), window.innerHeight, threshold)) {
      setState('idle')
      return
    }
    // Runs before paint, so there is no frame where the block is visible and then vanishes.
    setState('hidden')
    const stop = observeVisibility(
      el,
      (visible) => {
        if (!visible) return
        // Play once: release the observer now instead of waiting for unmount.
        stop()
        setState('shown')
      },
      { threshold },
    )
    return stop
  }, [reduced, threshold])

  const onTransitionEnd = useCallback((e: { target: EventTarget; currentTarget: EventTarget }) => {
    // Transitions on descendants bubble up; only the block's own end settles it.
    if (e.target === e.currentTarget) setState((s) => (s === 'shown' ? 'done' : s))
  }, [])

  const delay = delayMs ?? (index === undefined ? 0 : revealDelayMs(index, stepMs))
  const style = (delay > 0 ? { '--reveal-delay': `${delay}ms` } : undefined) as
    CSSProperties | undefined

  return { ref, state, props: { 'data-reveal': state, style, onTransitionEnd } }
}
