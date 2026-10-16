import { useEffect, useRef, type DependencyList, type RefObject } from 'react'
import { prefersReducedMotion } from './reduced-motion'

// Type-only imports are erased at build time; gsap itself must only ever be reached through the
// dynamic imports below so it stays in its own lazy chunk (budget: animation libs <= 60 KB gzip,
// loaded after hydration, accessibility-performance.md section 2).
type Gsap = typeof import('gsap').gsap
type ScrollTriggerPlugin = typeof import('gsap/ScrollTrigger').ScrollTrigger

export type GsapBundle = { gsap: Gsap; ScrollTrigger: ScrollTriggerPlugin }

let pending: Promise<GsapBundle> | null = null

/**
 * Lazily load GSAP core and ScrollTrigger and register the plugin exactly once.
 *
 * Resolves `null` without importing anything when the user prefers reduced motion: motion.md
 * section 9 turns scroll scrub, count-up and every GSAP-driven scene into static content, so the
 * library has no job to do. Callers must treat null as "render the static version".
 *
 * Gotchas:
 * - The promise is shared, so a second section does not download or register again.
 * - A failed import (offline chunk load) clears the cache so the next call retries; caching the
 *   rejection would disable animation until a full reload.
 * - ScrollTrigger listens to scroll with passive listeners on its own; do not add scroll handlers
 *   that call preventDefault or run layout reads on every event.
 */
export function loadGsap(): Promise<GsapBundle | null> {
  if (prefersReducedMotion()) return Promise.resolve(null)
  pending ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    .then(([gsapModule, stModule]) => {
      const gsap = gsapModule.gsap ?? gsapModule.default
      const ScrollTrigger = stModule.ScrollTrigger ?? stModule.default
      gsap.registerPlugin(ScrollTrigger)
      return { gsap, ScrollTrigger }
    })
    .catch((error: unknown) => {
      pending = null
      throw error
    })
  return pending
}

/**
 * Run GSAP setup for one component, scoped and self-cleaning.
 *
 * `setup` runs inside `gsap.context(..., scopeRef.current)`: selectors are scoped to that element
 * and every tween and ScrollTrigger created synchronously inside is reverted on unmount. It may
 * return a cleanup function. Never runs under reduced motion, before mount, or after unmount.
 *
 * Route-change safety: Next.js unmounts the page's components on navigation, which runs the
 * cleanup below. ScrollTriggers created later (in a timeline callback, an event handler) are not
 * owned by the context unless wrapped in `ctx.add`, so a final sweep also kills any trigger whose
 * element is inside the scope.
 *
 * `setup` is read from a ref, so an inline arrow does not re-run the effect; pass `deps` to
 * re-run it deliberately. The reduced-motion decision is taken at mount, not tracked live.
 *
 * `enabled: false` keeps the library unloaded: a section that only needs GSAP once it is near the
 * viewport arms the hook then, instead of downloading the chunk on every page that contains it.
 */
export function useGsapContext(
  scopeRef: RefObject<HTMLElement | null>,
  setup: (bundle: GsapBundle) => void | (() => void),
  deps: DependencyList = [],
  enabled = true,
) {
  const setupRef = useRef(setup)
  useEffect(() => {
    setupRef.current = setup
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let ctx: ReturnType<Gsap['context']> | undefined
    let userCleanup: (() => void) | undefined
    let scope: HTMLElement | null = null
    let bundle: GsapBundle | null = null

    loadGsap().then(
      (loaded) => {
        scope = scopeRef.current
        if (!loaded || cancelled || !scope) return
        bundle = loaded
        ctx = loaded.gsap.context(() => {
          const result = setupRef.current(loaded)
          if (typeof result === 'function') userCleanup = result
        }, scope)
      },
      // Animation is an enhancement and the content is already in the HTML, so a failed chunk
      // load degrades to the static page. Setup errors are not caught here and stay visible.
      () => {},
    )

    return () => {
      cancelled = true
      userCleanup?.()
      ctx?.revert()
      ctx?.kill()
      const owner = scope
      if (bundle && owner) {
        for (const trigger of bundle.ScrollTrigger.getAll()) {
          if (trigger.trigger && owner.contains(trigger.trigger as Node)) trigger.kill()
        }
      }
    }
    // The caller's deps are the contract; the ref and setup identity are deliberately excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeRef, enabled, ...deps])
}
