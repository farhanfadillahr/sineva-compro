// Shared jsdom shims for the motion tests. jsdom ships neither matchMedia nor IntersectionObserver,
// and the code under test must work with both absent (SSR, old browsers), so each test opts in.
import { vi } from 'vitest'

export type MediaController = {
  /** Flip the `(prefers-reduced-motion: reduce)` match and notify listeners. */
  set: (matches: boolean) => void
  listenerCount: () => number
}

export function installMatchMedia(initial: boolean): MediaController {
  let matches = initial
  const listeners = new Set<(e: MediaQueryListEvent) => void>()
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return matches
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia
  return {
    set(next) {
      matches = next
      for (const cb of [...listeners]) cb({ matches: next } as MediaQueryListEvent)
    },
    listenerCount: () => listeners.size,
  }
}

export function removeMatchMedia() {
  // @ts-expect-error simulate an environment without matchMedia
  delete window.matchMedia
}

type Entry = Partial<IntersectionObserverEntry> & { target: Element }

export class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  observed = new Set<Element>()
  disconnected = false
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIntersectionObserver.instances.push(this)
  }
  observe = (el: Element) => {
    this.observed.add(el)
  }
  unobserve = (el: Element) => {
    this.observed.delete(el)
  }
  disconnect = () => {
    this.observed.clear()
    this.disconnected = true
  }
  takeRecords = () => []
  root = null
  rootMargin = ''
  thresholds = []

  /** Deliver an entry for `target` the way the browser would. */
  static fire(target: Element, partial: Omit<Entry, 'target'>) {
    const entry = {
      isIntersecting: false,
      intersectionRatio: 0,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: 0,
      ...partial,
      target,
    } as IntersectionObserverEntry
    for (const io of MockIntersectionObserver.instances) {
      if (io.observed.has(target)) io.callback([entry], io as unknown as IntersectionObserver)
    }
  }

  static liveObserverCount() {
    return MockIntersectionObserver.instances.filter((i) => !i.disconnected).length
  }
}

export function installIntersectionObserver() {
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  return MockIntersectionObserver
}

/** Place an element at a fixed rect; jsdom lays nothing out so every rect is zero by default. */
export function setRect(
  el: Element,
  rect: { top: number; height: number; left?: number; width?: number },
) {
  const { top, height, left = 0, width = 100 } = rect
  el.getBoundingClientRect = () =>
    ({
      top,
      height,
      left,
      width,
      bottom: top + height,
      right: left + width,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

export function setViewportHeight(px: number) {
  Object.defineProperty(window, 'innerHeight', { value: px, configurable: true, writable: true })
}

export function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  Object.defineProperty(document, 'hidden', { value: state === 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

/** Flush resolved promises and microtasks (dynamic imports in mocks resolve across several ticks). */
export async function flush(times = 5) {
  for (let i = 0; i < times; i++) await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
}
