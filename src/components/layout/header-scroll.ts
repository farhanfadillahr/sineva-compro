import { useCallback, useEffect, useReducer, type PointerEvent } from 'react'

/** motion.md section 5: the regular header holds up to this offset; one downward run uses it too. */
export const SCROLL_THRESHOLD_PX = 8

/** motion.md section 5: a floating nav with no scroll for this long hides itself. */
export const IDLE_HIDE_MS = 2500

/**
 * - `top`: the regular full-width transparent header.
 * - `floating-visible`: the centred pill, on screen.
 * - `floating-hidden`: the pill, slid out and faded.
 */
export type HeaderMode = 'top' | 'floating-visible' | 'floating-hidden'

export type HeaderState = Readonly<{
  mode: HeaderMode
  /** Last offset seen, clamped to 0 (iOS rubber-band reports negative values). */
  y: number
  /** Pixels scrolled down in the current downward run; any upward step or hold wipes it. */
  travel: number
  pointerInside: boolean
  /** Keyboard focus only (see useKeyboardFocusWithin). */
  focusInside: boolean
  /** A dropdown or the mobile menu is open. */
  menuOpen: boolean
}>

export type HeaderEvent =
  /** The delta is derived from the previous offset kept in the state. */
  | Readonly<{ type: 'scroll'; y: number }>
  | Readonly<{ type: 'idleTimeout' }>
  | Readonly<{ type: 'pointerEnter' }>
  | Readonly<{ type: 'pointerLeave' }>
  | Readonly<{ type: 'focusIn' }>
  | Readonly<{ type: 'focusOut' }>
  | Readonly<{ type: 'menuOpen' }>
  | Readonly<{ type: 'menuClose' }>
  | Readonly<{ type: 'reachTop' }>

export const createHeaderState = (y: number): HeaderState => {
  const clamped = Math.max(0, y)
  return {
    // A page that loads already scrolled (reload, anchor, restored position) has no direction yet:
    // stay out of the way until the visitor scrolls up.
    mode: clamped <= SCROLL_THRESHOLD_PX ? 'top' : 'floating-hidden',
    y: clamped,
    travel: 0,
    pointerInside: false,
    focusInside: false,
    menuOpen: false,
  }
}

/** Pointer over the nav, a menu open or keyboard focus inside: the nav must not hide. */
export const isHeld = (state: HeaderState): boolean =>
  state.pointerInside || state.focusInside || state.menuOpen

const KEYS = ['mode', 'y', 'travel', 'pointerInside', 'focusInside', 'menuOpen'] as const

/** Returns `state` itself when the patch changes nothing, so React skips the render. */
function patch(state: HeaderState, changes: Partial<HeaderState>): HeaderState {
  return KEYS.every((key) => !(key in changes) || changes[key] === state[key])
    ? state
    : { ...state, ...changes }
}

/** A hold starting shows a hidden pill (focus can land in it) and wipes the downward run. */
function hold(state: HeaderState, flag: 'pointerInside' | 'focusInside' | 'menuOpen') {
  return patch(state, {
    [flag]: true,
    travel: 0,
    mode: state.mode === 'floating-hidden' ? 'floating-visible' : state.mode,
  })
}

/**
 * Pure state machine behind the header (motion.md section 5). Scroll rules:
 * - at or under 8 px: `top`, always;
 * - leaving the top downwards: `floating-hidden` (`floating-visible` when held);
 * - any upward step below the top: `floating-visible`;
 * - more than 8 px of downward travel in one run: `floating-hidden`, unless held.
 *
 * The 8 px rule is applied to the run, not to one event: wheels and touch fire many events of a
 * few pixels each, so a per-event delta would almost never pass 8 px. Holds wipe the run, so after
 * the hold ends the nav needs a fresh 8 px of downward scrolling to hide.
 */
export function reduceHeader(state: HeaderState, event: HeaderEvent): HeaderState {
  switch (event.type) {
    case 'scroll': {
      const y = Math.max(0, event.y)
      if (y <= SCROLL_THRESHOLD_PX) return patch(state, { mode: 'top', y, travel: 0 })
      if (state.mode === 'top') {
        return patch(state, {
          mode: isHeld(state) ? 'floating-visible' : 'floating-hidden',
          y,
          travel: 0,
        })
      }
      if (y === state.y) return state
      if (y < state.y) return patch(state, { mode: 'floating-visible', y, travel: 0 })
      if (isHeld(state)) return patch(state, { mode: 'floating-visible', y, travel: 0 })
      const travel = state.travel + (y - state.y)
      return patch(state, {
        mode: travel > SCROLL_THRESHOLD_PX ? 'floating-hidden' : state.mode,
        y,
        travel,
      })
    }
    case 'idleTimeout':
      return state.mode === 'floating-visible' && !isHeld(state)
        ? patch(state, { mode: 'floating-hidden', travel: 0 })
        : state
    case 'reachTop':
      return patch(state, { mode: 'top', y: Math.min(state.y, SCROLL_THRESHOLD_PX), travel: 0 })
    case 'pointerEnter':
      return hold(state, 'pointerInside')
    case 'focusIn':
      return hold(state, 'focusInside')
    case 'menuOpen':
      return hold(state, 'menuOpen')
    case 'pointerLeave':
      return patch(state, { pointerInside: false, travel: 0 })
    case 'focusOut':
      return patch(state, { focusInside: false, travel: 0 })
    case 'menuClose':
      return patch(state, { menuOpen: false, travel: 0 })
  }
}

/**
 * Drives the state machine from the DOM and owns the idle timer.
 *
 * @param menuOpen       A dropdown or the mobile menu is open (or closing).
 * @param keyboardFocus  Keyboard focus is inside the header.
 * @param frozen         Ignores scroll events entirely. Used while the mobile menu locks the body:
 *                       the body is `position: fixed`, so the browser reports offset 0, and
 *                       counting that (and the later restore) as scrolling would change the mode
 *                       when the menu closes.
 * @returns the mode and the pointer handlers for the element that counts as "the nav".
 */
export function useHeaderMode({
  menuOpen,
  keyboardFocus,
  frozen,
}: {
  menuOpen: boolean
  keyboardFocus: boolean
  frozen: boolean
}) {
  const [state, dispatch] = useReducer(reduceHeader, 0, createHeaderState)

  // The page can load already scrolled, and the scroll listener only sees later changes. A scroll
  // event from `top` is the same transition as a real scroll, so it reuses the reducer.
  useEffect(() => {
    dispatch({ type: 'scroll', y: window.scrollY })
  }, [])

  // The ref-free form of "ignore while frozen": the listener is rebound when `frozen` flips.
  useEffect(() => {
    if (frozen) return
    const onScroll = () => dispatch({ type: 'scroll', y: window.scrollY })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [frozen])

  // Applied on change, not on the next scroll: focus can enter a hidden header. The reducer takes
  // no offset for these, which matters while the mobile menu is open or just closed, when the
  // real offset is momentarily not the page's scroll position.
  useEffect(() => {
    dispatch({ type: menuOpen ? 'menuOpen' : 'menuClose' })
  }, [menuOpen])
  useEffect(() => {
    dispatch({ type: keyboardFocus ? 'focusIn' : 'focusOut' })
  }, [keyboardFocus])

  // Idle countdown: only while the pill is on screen and nothing holds it. Every scroll step
  // (state.y) and every hold change restarts it, which also covers "paused while held" and
  // "restarted on leave" without a second timer.
  const held = isHeld(state)
  useEffect(() => {
    if (state.mode !== 'floating-visible' || held) return
    const timer = setTimeout(() => dispatch({ type: 'idleTimeout' }), IDLE_HIDE_MS)
    return () => clearTimeout(timer)
  }, [state.mode, state.y, held])

  const onPointerEnter = useCallback((event: PointerEvent<HTMLElement>) => {
    // Touch has no hover: its pointerenter only marks the start of a tap or drag.
    if (event.pointerType !== 'touch') dispatch({ type: 'pointerEnter' })
  }, [])
  const onPointerLeave = useCallback(() => dispatch({ type: 'pointerLeave' }), [])

  return { mode: state.mode, pointerHandlers: { onPointerEnter, onPointerLeave } }
}
