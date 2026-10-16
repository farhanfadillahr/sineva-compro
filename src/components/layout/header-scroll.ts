import { useEffect, useRef, useState } from 'react'

/** motion.md section 5: both the surface and the hide behaviour use an 8 px threshold. */
export const SCROLL_THRESHOLD_PX = 8

export type ScrollState = Readonly<{
  /** Last offset seen, clamped to 0 (iOS rubber-band reports negative values). */
  y: number
  /** Past the threshold: the header gets its blurred surface and hairline. */
  scrolled: boolean
  hidden: boolean
  /** Pixels scrolled down in the current downward run. */
  travel: number
  direction: 'down' | 'up' | 'none'
}>

export const createScrollState = (y: number): ScrollState => {
  const clamped = Math.max(0, y)
  return {
    y: clamped,
    scrolled: clamped > SCROLL_THRESHOLD_PX,
    hidden: false,
    travel: 0,
    direction: 'none',
  }
}

const same = (a: ScrollState, b: ScrollState) =>
  a.y === b.y &&
  a.scrolled === b.scrolled &&
  a.hidden === b.hidden &&
  a.travel === b.travel &&
  a.direction === b.direction

/**
 * Pure reducer behind the header's scroll behaviour. The 8 px rule is applied to the distance
 * scrolled down in one run, not to a single event: wheels and touch fire many events of a few
 * pixels each, so a per-event delta would almost never pass 8 px.
 *
 * `locked` (dropdown or menu open, keyboard focus inside) keeps the header visible and wipes the
 * run, so after the lock ends the header needs a fresh 8 px of downward scrolling to hide.
 * Returns `previous` when nothing changed so React can skip the render.
 */
export function nextScrollState(
  previous: ScrollState,
  rawY: number,
  { locked }: { locked: boolean },
): ScrollState {
  const y = Math.max(0, rawY)
  const scrolled = y > SCROLL_THRESHOLD_PX

  let next: ScrollState
  if (locked) {
    next = { y, scrolled, hidden: false, travel: 0, direction: 'none' }
  } else if (y === previous.y) {
    next = { ...previous, scrolled }
  } else if (y < previous.y) {
    // Scrolling up shows the header immediately, by any amount.
    next = { y, scrolled, hidden: false, travel: 0, direction: 'up' }
  } else {
    const travel = (previous.direction === 'down' ? previous.travel : 0) + (y - previous.y)
    next = { y, scrolled, hidden: travel > SCROLL_THRESHOLD_PX, travel, direction: 'down' }
  }
  return same(previous, next) ? previous : next
}

/**
 * @param locked  Keeps the header visible (dropdown/menu open, keyboard focus inside).
 * @param frozen  Ignores scroll events entirely. Used while the mobile menu locks the body: the
 *                body is `position: fixed`, so the browser reports offset 0, and counting that
 *                (and the later restore) as scrolling would hide the header on close.
 */
export function useHeaderScroll({
  locked,
  frozen,
}: {
  locked: boolean
  frozen: boolean
}): ScrollState {
  const [state, setState] = useState<ScrollState>(() => createScrollState(0))
  const lockedRef = useRef(locked)
  const frozenRef = useRef(frozen)

  useEffect(() => {
    lockedRef.current = locked
    frozenRef.current = frozen
  }, [locked, frozen])

  // The page can load already scrolled (reload, anchor, restored position).
  useEffect(() => {
    // Not a cascading render: it runs once, and only when the page did not start at the top.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(createScrollState(window.scrollY))
    const onScroll = () => {
      if (frozenRef.current) return
      setState((previous) =>
        nextScrollState(previous, window.scrollY, { locked: lockedRef.current }),
      )
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Apply a lock change without waiting for the next scroll event (focus can enter a hidden
  // header). It reuses the last known offset instead of reading window.scrollY: while the mobile
  // menu is open or just closed the real offset is momentarily not the page's scroll position.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((previous) => nextScrollState(previous, previous.y, { locked }))
  }, [locked])

  return state
}
