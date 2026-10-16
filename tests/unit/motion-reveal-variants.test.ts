// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { createElement as createElementStrict, type ReactElement, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Reveal, type RevealProps } from '../../src/components/motion/Reveal'
import {
  MockIntersectionObserver as IO,
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
  setRect,
  setViewportHeight,
} from './motion-test-utils'

// The strict overloads reject string children and ref-less elements; these tests build small trees.
const createElement = createElementStrict as unknown as (
  type: unknown,
  props?: unknown,
  ...children: unknown[]
) => ReactElement

const VIEWPORT = 800

class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  constructor(public cb: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this)
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  fire(width: number) {
    this.cb([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  setViewportHeight(VIEWPORT)
  installIntersectionObserver()
  installMatchMedia(false)
  MockResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  removeMatchMedia()
})

/**
 * jsdom does no layout: pin the wrapper rect and make each word report the line it would wrap to.
 * `lines` maps a word to its line index.
 */
function pin(top: number, lines: string[][] = [['Make', 'work', 'feel'], ['lighter']]) {
  const lineOf = new Map<string, number>()
  lines.forEach((ws, i) => ws.forEach((w) => lineOf.set(w, i)))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const isWord = this.hasAttribute('data-word')
    const t = isWord ? (lineOf.get(this.textContent ?? '') ?? 0) * 40 : top
    return {
      top: t,
      height: isWord ? 32 : 200,
      bottom: t + 32,
      left: 0,
      right: 0,
      width: 0,
    } as DOMRect
  })
}

function header(extra = '') {
  return createElement(
    'div',
    null,
    createElement('p', { 'data-reveal-part': 'eyebrow' }, 'Eyebrow'),
    createElement(
      'h2',
      { 'data-reveal-part': 'title', ...(extra ? {} : {}) },
      'Make work feel lighter',
    ),
    createElement('p', { 'data-reveal-part': 'lead' }, 'Lead copy'),
  )
}

function renderReveal(
  props: Partial<RevealProps> & Record<string, unknown>,
  children: ReactNode = header(),
) {
  const view = render(
    createElement(Reveal, { 'data-testid': 'r', ...props } as RevealProps, children),
  )
  const el = view.getByTestId('r')
  setRect(el, { top: 2000, height: 200 })
  return { ...view, el }
}

describe('variant: server render', () => {
  it.each(['rise', 'lines', 'depth', 'clip', 'rise-scale'] as const)(
    '%s renders its final state and names its variant',
    (variant) => {
      const html = renderToString(
        createElement(Reveal, { variant }, createElement('h2', null, 'Title')),
      )
      expect(html).toContain('Title')
      expect(html).toContain('data-reveal="idle"')
      expect(html).toContain(`data-reveal-variant="${variant}"`)
      expect(html).not.toContain('data-reveal="hidden"')
      expect(html).not.toMatch(/opacity\s*:\s*0/)
    },
  )

  it('defaults to rise', () => {
    expect(renderToString(createElement(Reveal, null, 'x'))).toContain('data-reveal-variant="rise"')
  })
})

describe('variant: lines', () => {
  it('splits the heading into masked lines before first paint when below the fold', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'lines' })
    expect(el.dataset.reveal).toBe('hidden')
    const title = el.querySelector('[data-reveal-part="title"]')!
    expect(title.hasAttribute('data-split')).toBe(true)
    expect(title.getAttribute('aria-label')).toBe('Make work feel lighter')
    expect([...title.querySelectorAll('[data-line]')].map((l) => l.textContent)).toEqual([
      'Make work feel',
      'lighter',
    ])
  })

  it('leaves an in-view heading alone: no split, no animation twice', () => {
    pin(100)
    const view = render(
      createElement(Reveal, { variant: 'lines', 'data-testid': 'r' } as RevealProps, header()),
    )
    const el = view.getByTestId('r')
    expect(el.dataset.reveal).toBe('idle')
    expect(el.querySelector('[data-split]')).toBeNull()
    expect(el.querySelector('h2')?.textContent).toBe('Make work feel lighter')
  })

  it('keeps the lines through the reveal, then restores the original text when it settles', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'lines' })
    const title = el.querySelector('h2')!
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    expect(el.dataset.reveal).toBe('shown')
    expect(title.hasAttribute('data-split')).toBe(true)
    // 2 lines: 700 + 70 for the second line, plus slack.
    act(() => void vi.advanceTimersByTime(1200))
    expect(el.dataset.reveal).toBe('done')
    expect(title.hasAttribute('data-split')).toBe(false)
    expect(title.hasAttribute('aria-label')).toBe(false)
    expect(title.childNodes).toHaveLength(1)
    expect(title.textContent).toBe('Make work feel lighter')
  })

  it('falls back to a plain fade (no split) for a heading with markup inside', () => {
    pin(2000)
    const { el } = renderReveal(
      { variant: 'lines' },
      createElement('h2', { 'data-reveal-part': 'title' }, 'A ', createElement('em', null, 'B')),
    )
    expect(el.dataset.reveal).toBe('hidden')
    expect(el.querySelector('[data-split]')).toBeNull()
  })

  it('falls back to the first heading when the block has no marked title', () => {
    pin(2000)
    const { el } = renderReveal(
      { variant: 'lines' },
      createElement('h3', null, 'Make work feel lighter'),
    )
    expect(el.querySelector('h3')?.hasAttribute('data-split')).toBe(true)
  })

  it('re-splits after a resize, debounced, only while still waiting to reveal', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'lines' })
    const title = el.querySelector('h2')!
    expect(title.querySelectorAll('[data-line]')).toHaveLength(2)
    const ro = MockResizeObserver.instances.at(-1)!
    ro.fire(1000) // first callback records the width
    // The heading now wraps onto three lines.
    pin(2000, [['Make', 'work'], ['feel'], ['lighter']])
    ro.fire(600)
    ro.fire(500)
    expect(title.querySelectorAll('[data-line]')).toHaveLength(2)
    act(() => void vi.advanceTimersByTime(149))
    expect(title.querySelectorAll('[data-line]')).toHaveLength(2)
    act(() => void vi.advanceTimersByTime(2))
    expect(title.querySelectorAll('[data-line]')).toHaveLength(3)
  })

  it('does not re-split when the width did not change', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'lines' })
    const title = el.querySelector('h2')!
    const first = title.querySelector('[data-line]')
    const ro = MockResizeObserver.instances.at(-1)!
    ro.fire(1000)
    ro.fire(1000)
    act(() => void vi.advanceTimersByTime(500))
    expect(title.querySelector('[data-line]')).toBe(first)
  })

  it('reverts the split and disconnects its observers on unmount', () => {
    pin(2000)
    const view = renderReveal({ variant: 'lines' })
    const title = view.el.querySelector('h2')!
    const ro = MockResizeObserver.instances.at(-1)!
    view.unmount()
    expect(ro.disconnect).toHaveBeenCalled()
    expect(title.hasAttribute('data-split')).toBe(false)
  })

  it('never splits under reduced motion', () => {
    installMatchMedia(true)
    pin(2000)
    const { el } = renderReveal({ variant: 'lines' })
    expect(el.dataset.reveal).toBe('idle')
    expect(el.querySelector('[data-split]')).toBeNull()
  })

  it('applies the optional delay to the whole block', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'lines', delayMs: 80 })
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('80ms')
  })
})

describe('variant: depth', () => {
  it('starts at the from state below the fold and plays on entry', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'depth' }, createElement('p', null, 'card'))
    expect(el.dataset.reveal).toBe('hidden')
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    act(() => void vi.runAllTimers())
    expect(el.dataset.reveal).toBe('shown')
  })

  it('staggers cards that arrive together by 60 ms, in document order, and ignores index', () => {
    pin(2000)
    const view = render(
      createElement(
        'ul',
        null,
        ...[0, 1, 2].map((i) =>
          createElement(
            Reveal,
            {
              as: 'li',
              variant: 'depth',
              index: 5 - i,
              key: i,
              'data-testid': `c${i}`,
            } as RevealProps,
            'card',
          ),
        ),
      ),
    )
    const cards = [0, 1, 2].map((i) => view.getByTestId(`c${i}`))
    // Observers deliver in a different order than the DOM.
    act(() => {
      for (const c of [cards[2]!, cards[0]!, cards[1]!])
        IO.fire(c, { isIntersecting: true, intersectionRatio: 0.3 })
    })
    act(() => void vi.runAllTimers())
    expect(cards.map((c) => c.style.getPropertyValue('--reveal-delay'))).toEqual([
      '',
      '60ms',
      '120ms',
    ])
    expect(cards.map((c) => c.dataset.reveal)).toEqual(['shown', 'shown', 'shown'])
  })

  it('adds an explicit delay on top of the batch stagger', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'depth', delayMs: 100 }, 'x')
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    act(() => void vi.runAllTimers())
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('100ms')
  })

  it('settles on the transform transition only, not on opacity finishing first', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'depth' }, 'x')
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    act(() => void vi.advanceTimersByTime(1))
    fireEvent.transitionEnd(el, { propertyName: 'opacity' })
    expect(el.dataset.reveal).toBe('shown')
    fireEvent.transitionEnd(el, { propertyName: 'transform' })
    expect(el.dataset.reveal).toBe('done')
  })

  it('falls back to a timer if no transition event arrives', () => {
    pin(2000)
    const { el } = renderReveal({ variant: 'depth' }, 'x')
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    // First the batch closes (state becomes shown), then the settle timer is armed.
    act(() => void vi.advanceTimersByTime(1))
    act(() => void vi.advanceTimersByTime(1500))
    expect(el.dataset.reveal).toBe('done')
  })

  it('a card unmounted before the batch closes never updates state', () => {
    pin(2000)
    const view = renderReveal({ variant: 'depth' }, 'x')
    act(() => IO.fire(view.el, { isIntersecting: true, intersectionRatio: 0.3 }))
    view.unmount()
    expect(() => act(() => void vi.runAllTimers())).not.toThrow()
  })
})

describe('variant: clip', () => {
  it('settles on the clip-path transition, which outlasts the opacity fade', () => {
    pin(2000)
    const { el } = renderReveal(
      { variant: 'clip' },
      createElement('img', { alt: '', src: 'x.png' }),
    )
    expect(el.dataset.reveal).toBe('hidden')
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    expect(el.dataset.reveal).toBe('shown')
    fireEvent.transitionEnd(el, { propertyName: 'opacity' })
    expect(el.dataset.reveal).toBe('shown')
    fireEvent.transitionEnd(el, { propertyName: 'clip-path' })
    expect(el.dataset.reveal).toBe('done')
  })
})

describe('variant: rise (unchanged behaviour)', () => {
  it('still uses the index stagger', () => {
    pin(2000)
    const { el } = renderReveal({ index: 2 }, 'x')
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('100ms')
  })
})
