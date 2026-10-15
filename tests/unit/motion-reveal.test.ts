// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isInViewport, observeVisibility } from '../../src/lib/motion/in-view'
import { revealDelayMs, useReveal } from '../../src/lib/motion/use-reveal'
import { Reveal } from '../../src/components/motion/Reveal'
import {
  type MediaController,
  MockIntersectionObserver as IO,
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
  setRect,
  setViewportHeight,
} from './motion-test-utils'

const VIEWPORT = 800

beforeEach(() => {
  setViewportHeight(VIEWPORT)
  installIntersectionObserver()
  installMatchMedia(false)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  removeMatchMedia()
})

/** Render a Reveal whose element sits at `top` (px from viewport top) with the given height. */
function renderAt(top: number, props: Record<string, unknown> = {}, height = 200) {
  // jsdom does no layout: pin every element's rect before React mounts it.
  const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    setRect(this, { top, height })
    return this.getBoundingClientRect()
  })
  const view = render(createElement(Reveal, { 'data-testid': 'r', ...props }, 'Hello'))
  spy.mockRestore()
  const el = view.getByTestId('r')
  setRect(el, { top, height })
  return { ...view, el }
}

describe('revealDelayMs (stagger)', () => {
  it('steps 50 ms per item', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => revealDelayMs(i))).toEqual([0, 50, 100, 150, 200, 250])
  })

  it('caps at 6 items: item 6 and beyond start together with the sixth', () => {
    expect(revealDelayMs(6)).toBe(250)
    expect(revealDelayMs(7)).toBe(250)
    expect(revealDelayMs(50)).toBe(250)
  })

  it('clamps a custom step into the documented 40-60 ms window', () => {
    expect(revealDelayMs(1, 10)).toBe(40)
    expect(revealDelayMs(1, 100)).toBe(60)
    expect(revealDelayMs(2, 45)).toBe(90)
  })

  it('treats negative or fractional indexes as the first item', () => {
    expect(revealDelayMs(-3)).toBe(0)
    expect(revealDelayMs(Number.NaN)).toBe(0)
  })
})

describe('isInViewport', () => {
  const rect = (top: number, height: number) => ({ top, height, bottom: top + height })

  it('is true when at least the threshold fraction is visible', () => {
    expect(isInViewport(rect(100, 200), VIEWPORT, 0.15)).toBe(true)
    // 40 of 400 px visible = 10%, below 15%
    expect(isInViewport(rect(VIEWPORT - 40, 400), VIEWPORT, 0.15)).toBe(false)
    // 60 of 400 px visible = 15%
    expect(isInViewport(rect(VIEWPORT - 60, 400), VIEWPORT, 0.15)).toBe(true)
  })

  it('counts elements wholly above the viewport as already seen', () => {
    expect(isInViewport(rect(-500, 100), VIEWPORT, 0.15)).toBe(true)
  })

  it('is false for elements wholly below the fold', () => {
    expect(isInViewport(rect(VIEWPORT + 10, 100), VIEWPORT, 0.15)).toBe(false)
  })

  it('handles elements taller than the viewport by the visible share of the viewport', () => {
    // 12000 px block filling the viewport: ratio is 6.7%, but it can never reach 15% on its own
    expect(isInViewport(rect(0, 12000), VIEWPORT, 0.15)).toBe(true)
  })

  it('handles zero-height elements by position', () => {
    expect(isInViewport(rect(100, 0), VIEWPORT, 0.15)).toBe(true)
    expect(isInViewport(rect(VIEWPORT + 100, 0), VIEWPORT, 0.15)).toBe(false)
  })
})

describe('observeVisibility', () => {
  it('reports visible only once the threshold ratio is met', () => {
    const el = document.createElement('div')
    const seen: boolean[] = []
    observeVisibility(el, (v) => seen.push(v), { threshold: 0.15 })
    IO.fire(el, { isIntersecting: true, intersectionRatio: 0.05 })
    IO.fire(el, { isIntersecting: true, intersectionRatio: 0.2 })
    IO.fire(el, { isIntersecting: false, intersectionRatio: 0 })
    expect(seen).toEqual([false, true, false])
  })

  it('returns a disconnect function', () => {
    const el = document.createElement('div')
    const stop = observeVisibility(el, () => {})
    expect(IO.liveObserverCount()).toBe(1)
    stop()
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('is a harmless no-op without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const stop = observeVisibility(document.createElement('div'), () => {})
    expect(() => stop()).not.toThrow()
  })
})

describe('Reveal: server render and no-JS', () => {
  it('server HTML carries the final state: content present, nothing hidden', () => {
    const html = renderToString(
      createElement(Reveal, { index: 3 }, createElement('p', null, 'Body')),
    )
    expect(html).toContain('Body')
    expect(html).toContain('data-reveal="idle"')
    expect(html).not.toMatch(/opacity\s*:\s*0/)
    expect(html).not.toContain('hidden')
    expect(html).not.toContain('data-reveal="hidden"')
  })
})

describe('Reveal: client behaviour', () => {
  it('applies the from state to elements below the fold and observes them at a 15% threshold', () => {
    const { el } = renderAt(2000)
    expect(el.dataset.reveal).toBe('hidden')
    expect(IO.instances).toHaveLength(1)
    expect(IO.instances[0].options?.threshold).toBe(0.15)
    expect(IO.instances[0].observed.has(el)).toBe(true)
  })

  it('does not animate elements already in view at mount', () => {
    const { el } = renderAt(100)
    expect(el.dataset.reveal).toBe('idle')
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('does not animate elements already scrolled past at mount', () => {
    const { el } = renderAt(-900, {}, 100)
    expect(el.dataset.reveal).toBe('idle')
  })

  it('shows once the element enters view', () => {
    const { el } = renderAt(2000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    expect(el.dataset.reveal).toBe('shown')
  })

  it('stays hidden while less than 15% is visible', () => {
    const { el } = renderAt(2000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.05 }))
    expect(el.dataset.reveal).toBe('hidden')
  })

  it('plays once: stops observing after the reveal and never re-hides on re-entry', () => {
    const { el } = renderAt(2000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    expect(IO.liveObserverCount()).toBe(0)
    act(() => IO.fire(el, { isIntersecting: false, intersectionRatio: 0 }))
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.5 }))
    expect(el.dataset.reveal).toBe('shown')
  })

  it('settles to "done" (drops will-change) when the transition ends', () => {
    const { el } = renderAt(2000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    fireEvent.transitionEnd(el)
    expect(el.dataset.reveal).toBe('done')
  })

  it('ignores transition events bubbling from children', () => {
    const view = renderAt(2000, {}, 200)
    act(() => IO.fire(view.el, { isIntersecting: true, intersectionRatio: 0.3 }))
    const child = document.createElement('span')
    view.el.appendChild(child)
    fireEvent.transitionEnd(child)
    expect(view.el.dataset.reveal).toBe('shown')
  })

  it('disconnects its observer on unmount', () => {
    const view = renderAt(2000)
    expect(IO.liveObserverCount()).toBe(1)
    view.unmount()
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('writes the stagger delay for list items, capped at the sixth', () => {
    const a = renderAt(2000, { index: 2 })
    expect(a.el.style.getPropertyValue('--reveal-delay')).toBe('100ms')
    cleanup()
    const b = renderAt(2000, { index: 9 })
    expect(b.el.style.getPropertyValue('--reveal-delay')).toBe('250ms')
    cleanup()
    const c = renderAt(2000, {})
    expect(c.el.style.getPropertyValue('--reveal-delay')).toBe('')
  })

  it('lets an explicit delayMs win over the index', () => {
    const { el } = renderAt(2000, { index: 4, delayMs: 180 })
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('180ms')
  })

  it('renders the requested element and forwards className, id and data attributes', () => {
    const { el } = renderAt(2000, { as: 'li', className: 'card', id: 'x', 'data-kind': 'k' })
    expect(el.tagName).toBe('LI')
    expect(el.classList.contains('card')).toBe(true)
    expect(el.id).toBe('x')
    expect(el.dataset.kind).toBe('k')
  })

  it('leaves content alone when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { el } = renderAt(2000)
    expect(el.dataset.reveal).toBe('idle')
  })
})

describe('Reveal: reduced motion', () => {
  let media: MediaController
  beforeEach(() => {
    media = installMatchMedia(true)
  })

  it('renders the final state below the fold and never observes', () => {
    const { el } = renderAt(2000)
    expect(el.dataset.reveal).toBe('idle')
    expect(IO.instances).toHaveLength(0)
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('')
  })

  it('drops a pending from state if the user turns reduced motion on mid-session', () => {
    media.set(false)
    const { el } = renderAt(2000)
    expect(el.dataset.reveal).toBe('hidden')
    act(() => media.set(true))
    expect(el.dataset.reveal).toBe('idle')
    expect(IO.liveObserverCount()).toBe(0)
  })
})

describe('useReveal', () => {
  it('returns a ref, the state and ready-to-spread props', () => {
    let captured: ReturnType<typeof useReveal> | undefined
    function Probe() {
      captured = useReveal<HTMLDivElement>({ index: 1 })
      return createElement('div', { ref: captured.ref, ...captured.props, 'data-testid': 'p' })
    }
    const { getByTestId } = render(createElement(Probe))
    expect(captured?.state).toMatch(/idle|hidden/)
    expect(getByTestId('p').dataset.reveal).toBe(captured?.state)
    expect(getByTestId('p').style.getPropertyValue('--reveal-delay')).toBe('50ms')
  })
})

describe('Reveal.module.css', () => {
  const css = readFileSync(
    fileURLToPath(new URL('../../src/components/motion/Reveal.module.css', import.meta.url)),
    'utf8',
  )

  it('only hides content under the JS-applied hidden class, never on the base class', () => {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      selector: m[1].trim(),
      body: m[2],
    }))
    const hiding = rules.filter((r) => /opacity\s*:\s*0\s*[;}]/.test(r.body + ';'))
    expect(hiding.length).toBeGreaterThan(0)
    for (const r of hiding) expect(r.selector).toMatch(/\.hidden\b/)
  })

  it('animates only opacity and transform', () => {
    const transitions = [...css.matchAll(/transition(?:-property)?\s*:([^;]+);/g)].map((m) => m[1])
    expect(transitions.length).toBeGreaterThan(0)
    for (const t of transitions) expect(t).not.toMatch(/\b(width|height|top|left|box-shadow|all)\b/)
  })

  it('has a reduced-motion rule that restores the final state without a transition', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?\})\s*\}/.exec(css)?.[1]
    expect(block).toBeDefined()
    expect(block).toMatch(/\.hidden/)
    expect(block).toMatch(/opacity\s*:\s*1/)
    expect(block).toMatch(/transform\s*:\s*none/)
    expect(block).toMatch(/transition\s*:\s*none/)
  })

  it('uses the 24 px reveal distance', () => {
    expect(css).toMatch(/translate(Y|3d)\(\s*(0\s*,\s*)?var\(--reveal-distance,\s*24px\)/)
  })
})
