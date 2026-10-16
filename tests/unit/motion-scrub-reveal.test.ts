// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
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

// The real loader would import GSAP; the tests only care when it is asked for and what it is told.
const h = vi.hoisted(() => ({
  calls: [] as Array<{ enabled: boolean | undefined }>,
  fromTo: vi.fn(),
  runSetup: null as null | (() => void),
}))

vi.mock('../../src/lib/motion/gsap', () => ({
  useGsapContext: (
    scopeRef: { current: HTMLElement | null },
    setup: (b: unknown) => void,
    _deps: unknown[],
    enabled?: boolean,
  ) => {
    h.calls.push({ enabled })
    h.runSetup =
      enabled === false ? null : () => setup({ gsap: { fromTo: h.fromTo }, scope: scopeRef })
  },
}))

beforeEach(() => {
  setViewportHeight(800)
  installIntersectionObserver()
  installMatchMedia(false)
  h.calls.length = 0
  h.runSetup = null
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  removeMatchMedia()
})

function renderPanel(top: number, props: Record<string, unknown> = {}) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    setRect(this, { top, height: 400 })
    return this.getBoundingClientRect()
  })
  const view = render(
    createElement(
      Reveal,
      { variant: 'rise-scale', 'data-testid': 'p', ...props } as RevealProps,
      'panel',
    ),
  )
  vi.restoreAllMocks()
  const el = view.getByTestId('p')
  setRect(el, { top, height: 400 })
  return { ...view, el }
}

describe('rise-scale', () => {
  it('server HTML is the final state', () => {
    const html = renderToString(createElement(Reveal, { variant: 'rise-scale' }, 'panel'))
    expect(html).toContain('data-reveal="idle"')
    expect(html).toContain('data-reveal-variant="rise-scale"')
    expect(html).not.toContain('data-reveal="hidden"')
  })

  it('takes the from state before paint when below the fold, without loading GSAP yet', () => {
    const { el } = renderPanel(5000)
    expect(el.dataset.reveal).toBe('hidden')
    expect(h.calls.at(-1)?.enabled).toBe(false)
  })

  it('arms GSAP only when the panel is within about a screen of the viewport', () => {
    const { el } = renderPanel(5000)
    const near = IO.instances.find((io) => io.options?.rootMargin === '100% 0px')
    expect(near).toBeDefined()
    expect(near!.observed.has(el)).toBe(true)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.01 }))
    expect(h.calls.at(-1)?.enabled).toBe(true)
  })

  it('hands the panel to a scrubbed tween: scale .94, transparent, clipped to a 48 px radius', () => {
    const { el } = renderPanel(5000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.01 }))
    act(() => h.runSetup?.())
    expect(h.fromTo).toHaveBeenCalledTimes(1)
    const [target, from, to] = h.fromTo.mock.calls[0]
    expect(target).toBe(el)
    expect(from).toMatchObject({ scale: 0.94, opacity: 0, clipPath: 'inset(0px round 48px)' })
    expect(to).toMatchObject({ scale: 1, opacity: 1, ease: 'none' })
    expect(to.clipPath).toMatch(/^inset\(0px round \d+px\)$/)
    expect(to.scrollTrigger).toMatchObject({ trigger: el, scrub: true })
    // `clamp` keeps the end reachable when the panel sits near the bottom of a short page.
    expect(to.scrollTrigger.start).toMatch(/^clamp\(/)
    expect(to.scrollTrigger.end).toMatch(/^clamp\(/)
    // The CSS from state is dropped once GSAP owns the element.
    expect(el.dataset.reveal).toBe('done')
  })

  it('does not scrub a panel the CSS fallback already played (fast scroll before the chunk arrived)', () => {
    const { el } = renderPanel(5000)
    act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 0.3 }))
    expect(el.dataset.reveal).toBe('shown')
    act(() => h.runSetup?.())
    expect(h.fromTo).not.toHaveBeenCalled()
  })

  it('leaves a panel already in view alone and never arms GSAP', () => {
    const { el } = renderPanel(100)
    expect(el.dataset.reveal).toBe('idle')
    expect(h.calls.at(-1)?.enabled).toBe(false)
  })

  it('never arms GSAP under reduced motion', () => {
    installMatchMedia(true)
    const { el } = renderPanel(5000)
    expect(el.dataset.reveal).toBe('idle')
    expect(h.calls.at(-1)?.enabled).toBe(false)
  })
})
