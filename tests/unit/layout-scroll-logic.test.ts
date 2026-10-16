import { describe, expect, it } from 'vitest'
import {
  createHeaderState,
  IDLE_HIDE_MS,
  isHeld,
  reduceHeader,
  SCROLL_THRESHOLD_PX,
  type HeaderEvent,
  type HeaderState,
} from '../../src/components/layout/header-scroll'

const at = (y: number) => createHeaderState(y)

/** Feeds events one by one, like the stream the component dispatches. */
const run = (events: HeaderEvent[], from: HeaderState) => events.reduce(reduceHeader, from)
const scrolls = (...ys: number[]): HeaderEvent[] => ys.map((y) => ({ type: 'scroll', y }))

describe('header state machine: constants', () => {
  it('uses an 8 px top threshold and a 2.5 s idle timeout', () => {
    expect(SCROLL_THRESHOLD_PX).toBe(8)
    expect(IDLE_HIDE_MS).toBe(2500)
  })
})

describe('header state machine: top', () => {
  it('starts in top mode at the top of the page', () => {
    expect(at(0).mode).toBe('top')
    expect(at(8).mode).toBe('top')
  })

  it('stays in top mode while scrolling within 8 px', () => {
    expect(run(scrolls(3, 6, 8), at(0)).mode).toBe('top')
  })

  it('treats iOS rubber-band overscroll (negative offsets) as the top', () => {
    expect(run(scrolls(-40), at(0)).mode).toBe('top')
    expect(run(scrolls(200, -40), at(100)).mode).toBe('top')
  })

  it('starts hidden when the page loads already scrolled down (reload, anchor, restore)', () => {
    expect(at(400).mode).toBe('floating-hidden')
  })
})

describe('header state machine: scroll', () => {
  it('goes floating-hidden when scrolling down past the top', () => {
    expect(run(scrolls(8), at(0)).mode).toBe('top')
    expect(run(scrolls(9), at(0)).mode).toBe('floating-hidden')
    expect(run(scrolls(300), at(0)).mode).toBe('floating-hidden')
  })

  it('shows the floating nav on any upward scroll below the top', () => {
    const hidden = run(scrolls(400), at(0))
    expect(reduceHeader(hidden, { type: 'scroll', y: 399 }).mode).toBe('floating-visible')
  })

  it('hides again after more than 8 px of downward scrolling while visible', () => {
    const visible = run(scrolls(400, 390), at(0))
    expect(visible.mode).toBe('floating-visible')
    expect(run(scrolls(398), visible).mode).toBe('floating-visible')
    expect(run(scrolls(399), visible).mode).toBe('floating-hidden')
  })

  it('adds up small scroll events, because wheels and touch scroll in small steps', () => {
    const visible = run(scrolls(400, 390), at(0))
    expect(run(scrolls(393, 396), visible).mode).toBe('floating-visible')
    expect(run(scrolls(393, 396, 399), visible).mode).toBe('floating-hidden')
  })

  it('restarts the 8 px count when the direction changes', () => {
    const visible = run(scrolls(400, 390), at(0))
    // Down 6, up 2, down 6: neither downward run passes 8 px.
    expect(run(scrolls(396, 394, 400), visible).mode).toBe('floating-visible')
  })

  it('ignores a scroll event that did not move', () => {
    const visible = run(scrolls(400, 390), at(0))
    expect(reduceHeader(visible, { type: 'scroll', y: 390 })).toBe(visible)
  })
})

describe('header state machine: reaching the top', () => {
  it('always returns to top mode at 8 px or less', () => {
    expect(run(scrolls(400, 8), at(0)).mode).toBe('top')
    expect(run(scrolls(400, 390, 0), at(0)).mode).toBe('top')
  })

  it('returns to top from every floating mode, held or not', () => {
    const visible = run(scrolls(400, 390), at(0))
    const hidden = run(scrolls(400), at(0))
    const held = run([{ type: 'pointerEnter' }], visible)
    for (const state of [visible, hidden, held]) {
      expect(reduceHeader(state, { type: 'reachTop' }).mode).toBe('top')
      expect(reduceHeader(state, { type: 'scroll', y: 0 }).mode).toBe('top')
    }
  })

  it('leaves top mode with a visible nav when something holds it open', () => {
    const state = run([{ type: 'menuOpen' }, ...scrolls(300)], at(0))
    expect(state.mode).toBe('floating-visible')
  })

  it('goes back to hiding on the first scroll after the hold is released', () => {
    const state = run([{ type: 'menuOpen' }, ...scrolls(300), { type: 'menuClose' }], at(0))
    expect(state.mode).toBe('floating-visible')
    expect(reduceHeader(state, { type: 'scroll', y: 308 }).mode).toBe('floating-visible')
    expect(reduceHeader(state, { type: 'scroll', y: 309 }).mode).toBe('floating-hidden')
  })
})

describe('header state machine: idle timeout', () => {
  const visible = run(scrolls(400, 390), at(0))

  it('hides a visible floating nav', () => {
    expect(reduceHeader(visible, { type: 'idleTimeout' }).mode).toBe('floating-hidden')
  })

  it('does nothing in top mode: the regular header never auto-hides', () => {
    const top = at(0)
    expect(reduceHeader(top, { type: 'idleTimeout' })).toBe(top)
  })

  it('does nothing when already hidden', () => {
    const hidden = run(scrolls(400), at(0))
    expect(reduceHeader(hidden, { type: 'idleTimeout' })).toBe(hidden)
  })

  it.each([
    ['pointer is over the nav', 'pointerEnter'],
    ['a menu is open', 'menuOpen'],
    ['keyboard focus is inside', 'focusIn'],
  ] as const)('is ignored while the %s', (_label, type) => {
    const held = reduceHeader(visible, { type })
    expect(reduceHeader(held, { type: 'idleTimeout' }).mode).toBe('floating-visible')
  })

  it('applies again once every hold is released', () => {
    const state = run(
      [
        { type: 'pointerEnter' },
        { type: 'menuOpen' },
        { type: 'focusIn' },
        { type: 'pointerLeave' },
        { type: 'menuClose' },
      ],
      visible,
    )
    expect(isHeld(state)).toBe(true)
    expect(reduceHeader(state, { type: 'idleTimeout' }).mode).toBe('floating-visible')
    const released = reduceHeader(state, { type: 'focusOut' })
    expect(isHeld(released)).toBe(false)
    expect(reduceHeader(released, { type: 'idleTimeout' }).mode).toBe('floating-hidden')
  })
})

describe('header state machine: holds (pointer, menu, keyboard focus)', () => {
  it('track each source independently', () => {
    let state = at(0)
    expect(isHeld(state)).toBe(false)
    state = reduceHeader(state, { type: 'pointerEnter' })
    state = reduceHeader(state, { type: 'menuOpen' })
    expect(isHeld(state)).toBe(true)
    state = reduceHeader(state, { type: 'pointerLeave' })
    expect(isHeld(state)).toBe(true)
    state = reduceHeader(state, { type: 'menuClose' })
    expect(isHeld(state)).toBe(false)
  })

  it('never hide on scroll down while held', () => {
    for (const type of ['pointerEnter', 'menuOpen', 'focusIn'] as const) {
      const held = reduceHeader(run(scrolls(400, 390), at(0)), { type })
      expect(run(scrolls(500, 600), held).mode).toBe('floating-visible')
    }
  })

  it('show a hidden nav as soon as a hold starts (focus can enter a hidden header)', () => {
    const hidden = run(scrolls(400), at(0))
    for (const type of ['pointerEnter', 'menuOpen', 'focusIn'] as const) {
      expect(reduceHeader(hidden, { type }).mode).toBe('floating-visible')
    }
  })

  it('do not change the mode in top mode', () => {
    for (const type of ['pointerEnter', 'menuOpen', 'focusIn'] as const) {
      expect(reduceHeader(at(0), { type }).mode).toBe('top')
    }
  })

  it('need a fresh 8 px of downward scrolling after the hold ends', () => {
    const held = run(scrolls(400, 390, 500), reduceHeader(at(0), { type: 'menuOpen' }))
    const released = reduceHeader(held, { type: 'menuClose' })
    expect(reduceHeader(released, { type: 'scroll', y: 505 }).mode).toBe('floating-visible')
    expect(reduceHeader(released, { type: 'scroll', y: 509 }).mode).toBe('floating-hidden')
  })

  it('return the same object for a repeated event, so React skips the render', () => {
    const state = reduceHeader(at(0), { type: 'pointerEnter' })
    expect(reduceHeader(state, { type: 'pointerEnter' })).toBe(state)
    expect(reduceHeader(at(0), { type: 'pointerLeave' })).toEqual(at(0))
  })
})
