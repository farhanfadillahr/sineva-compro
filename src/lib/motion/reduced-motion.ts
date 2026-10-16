import { useSyncExternalStore } from 'react'

// The one place that decides what "reduced motion" means in JS. Everything else (Reveal, GSAP
// loader, Lottie player) asks this module; the CSS side has its own @media rule in the co-located
// CSS modules. Policy (motion.md section 9): opacity fades of 150 ms or less stay, everything
// else becomes an instant state change.
const QUERY = '(prefers-reduced-motion: reduce)'

/** Imperative read, accurate on the client at the moment of the call. False on the server. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

/** Call `onChange` whenever the preference flips. Returns the unsubscribe function. */
export function subscribeToReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * Reactive version. The server snapshot is always false, so the first client render during
 * hydration matches the server HTML; React then re-renders with the real value. Effects that
 * must decide *at mount* (loaders, observers) should call `prefersReducedMotion()` instead of
 * trusting this value on the first pass.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false)
}
