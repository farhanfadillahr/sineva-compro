import { describe, expect, it } from 'vitest'
import {
  createScrollState,
  nextScrollState,
  SCROLL_THRESHOLD_PX,
  type ScrollState,
} from '../../src/components/layout/header-scroll'

const at = (y: number) => createScrollState(y)

/** Feeds scroll offsets one by one, like a stream of scroll events. */
function run(positions: number[], from: ScrollState, locked = false) {
  return positions.reduce((state, y) => nextScrollState(state, y, { locked }), from)
}

describe('header scroll logic (motion.md section 5)', () => {
  it('uses an 8 px threshold', () => {
    expect(SCROLL_THRESHOLD_PX).toBe(8)
  })

  it('is transparent and visible at the top', () => {
    expect(at(0)).toMatchObject({ scrolled: false, hidden: false })
  })

  it('becomes scrolled only after more than 8 px', () => {
    expect(run([8], at(0)).scrolled).toBe(false)
    expect(run([9], at(0)).scrolled).toBe(true)
  })

  it('starts scrolled when the page loads already scrolled down', () => {
    expect(at(400)).toMatchObject({ scrolled: true, hidden: false })
  })

  it('hides when scrolling down by more than 8 px', () => {
    expect(run([108], at(100)).hidden).toBe(false)
    expect(run([109], at(100)).hidden).toBe(true)
  })

  it('adds up small scroll events, because wheels and touch scroll in small steps', () => {
    expect(run([103, 106], at(100)).hidden).toBe(false)
    expect(run([103, 106, 109], at(100)).hidden).toBe(true)
  })

  it('shows again immediately on any upward scroll', () => {
    const hidden = run([200], at(100))
    expect(hidden.hidden).toBe(true)
    expect(nextScrollState(hidden, 199, { locked: false }).hidden).toBe(false)
  })

  it('restarts the 8 px count when the direction changes', () => {
    // Down 6, up 2, down 6: neither downward run passes 8 px.
    expect(run([106, 104, 110], at(100)).hidden).toBe(false)
  })

  it('never hides near the top of the page', () => {
    expect(run([3, 6, 8], at(0)).hidden).toBe(false)
  })

  it('shows again when scrolled back to the top', () => {
    expect(run([200, 0], at(100)).hidden).toBe(false)
  })

  it('never hides while locked (dropdown or menu open, or keyboard focus inside)', () => {
    expect(run([200, 300], at(100), true).hidden).toBe(false)
  })

  it('needs a fresh 8 px of downward scrolling after the lock ends', () => {
    const lockedState = run([200], at(100), true)
    expect(nextScrollState(lockedState, 205, { locked: false }).hidden).toBe(false)
    expect(nextScrollState(lockedState, 209, { locked: false }).hidden).toBe(true)
  })

  it('shows a hidden header as soon as the lock starts', () => {
    const hidden = run([200], at(100))
    expect(hidden.hidden).toBe(true)
    expect(nextScrollState(hidden, 200, { locked: true }).hidden).toBe(false)
  })

  it('treats iOS rubber-band overscroll (negative offsets) as the top', () => {
    expect(run([200, -40], at(100)).hidden).toBe(false)
    expect(run([-40], at(0)).scrolled).toBe(false)
  })

  it('returns the same object when nothing changed, so React skips the render', () => {
    const state = run([200], at(100))
    expect(nextScrollState(state, 200, { locked: false })).toBe(state)
  })
})
