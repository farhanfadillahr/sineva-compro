import { act, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedPose } from '../../src/components/motion/animated-pose'
import { parallaxOffset } from '../../src/components/motion/animated-pose-math'
import type { MediaAsset } from '../../src/features/content/types'
import {
  type MediaController,
  MockIntersectionObserver as IO,
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
  setViewportHeight,
} from './motion-test-utils'

// AnimatedPose (mascot-sino.md section 5.1). jsdom does no layout, no scrolling and no media
// queries, so the browser is replaced by three controllable fakes: IntersectionObserver, matchMedia
// and requestAnimationFrame. Geometry is read from `data-top` and `data-height` on each element.

const VIEWPORT = 800
const IMAGE: MediaAsset = {
  url: '/mascot/poses/v006/sino-wave.webp',
  width: 1200,
  height: 1200,
  alt: '',
  blurDataUrl: null,
}

let frames: Map<number, FrameRequestCallback>
let nextFrameId: number
let rectSpy: ReturnType<typeof vi.spyOn>
let media: MediaController

/** Run every queued animation frame, as the browser does once per paint. */
function paintFrame() {
  const queued = [...frames.values()]
  frames.clear()
  act(() => queued.forEach((cb) => cb(0)))
}

beforeEach(() => {
  setViewportHeight(VIEWPORT)
  installIntersectionObserver()
  media = installMatchMedia(false)
  frames = new Map()
  nextFrameId = 1
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextFrameId++
    frames.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id)
  })
  // Unless a test says otherwise every element sits below the fold, so the reveal has work to do.
  rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const top = Number(this.dataset.top ?? 2000)
    const height = Number(this.dataset.height ?? 300)
    return {
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect
  })
})

afterEach(() => {
  rectSpy.mockRestore()
  vi.unstubAllGlobals()
  removeMatchMedia()
})

const pose = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-animated-pose]')!

function mount(props: Record<string, unknown> = {}, host: Record<string, string> = {}) {
  const view = render(
    <article data-testid="host" {...host}>
      <AnimatedPose image={IMAGE} sizes="50vw" {...props} />
    </article>,
  )
  const hostEl = view.getByTestId('host')
  return { ...view, hostEl, poseEl: pose(hostEl) }
}

/** Tell the mocked observers that the pose scrolled fully into view (or out of it). */
function setInView(el: Element, visible: boolean) {
  act(() => {
    IO.fire(el, { isIntersecting: visible, intersectionRatio: visible ? 1 : 0 })
  })
}

/** Net number of live listeners for one event on one target, from add/remove spies. */
function listenerCounter(target: EventTarget, type: string) {
  const add = vi.spyOn(target, 'addEventListener')
  const remove = vi.spyOn(target, 'removeEventListener')
  const calls = (spy: typeof add) => spy.mock.calls.filter(([t]) => t === type)
  return {
    live: () => calls(add).length - calls(remove).length,
    added: () => calls(add),
  }
}

describe('markup and server render', () => {
  it('renders the final state on the server: image visible, nothing waiting for JavaScript', () => {
    const html = renderToString(createElement(AnimatedPose, { image: IMAGE, sizes: '50vw' }))
    expect(html).toContain('<img')
    expect(html).toContain('data-reveal="idle"')
    expect(html).not.toContain('data-inview')
    expect(html).not.toContain('data-active')
  })

  it('renders nothing without an image', () => {
    const { container } = render(<AnimatedPose image={null} sizes="50vw" />)
    expect(container.firstChild).toBeNull()
  })

  it('keeps the asset box (width, height, empty alt) so layout cannot shift', () => {
    const { container } = mount()
    const img = container.querySelector('img')!
    expect(img.getAttribute('width')).toBe('1200')
    expect(img.getAttribute('height')).toBe('1200')
    expect(img.getAttribute('alt')).toBe('')
  })
})

describe('reveal on scroll', () => {
  it('starts hidden below the fold, reveals when it enters the viewport, and plays only once', () => {
    const { poseEl } = mount()
    expect(poseEl.getAttribute('data-reveal')).toBe('hidden')

    setInView(poseEl, true)
    expect(poseEl.getAttribute('data-reveal')).toBe('shown')

    // Scroll away and back: the state never returns to hidden.
    setInView(poseEl, false)
    setInView(poseEl, true)
    expect(poseEl.getAttribute('data-reveal')).toBe('shown')
  })

  it('is already final when it loads inside the viewport (no second animation)', () => {
    const { poseEl } = mount({ 'data-top': '100' })
    expect(poseEl.getAttribute('data-reveal')).toBe('idle')
  })
})

describe('idle float phase', () => {
  it('alternates the phase by index so neighbours do not move in sync', () => {
    const { container } = render(
      <>
        {[0, 1, 2, 3].map((i) => (
          <article key={i}>
            <AnimatedPose image={IMAGE} sizes="50vw" index={i} />
          </article>
        ))}
      </>,
    )
    const poses = [...container.querySelectorAll<HTMLElement>('[data-animated-pose]')]
    expect(poses.map((p) => p.getAttribute('data-phase'))).toEqual(['0', '1', '0', '1'])
    // The odd phase starts half a period (3 s) into the 6 s cycle.
    expect(poses.map((p) => p.style.getPropertyValue('--pose-float-delay'))).toEqual([
      '0s',
      '-3s',
      '0s',
      '-3s',
    ])
  })

  it('lets an explicit phase win over the index', () => {
    const { poseEl } = mount({ index: 0, phase: 1 })
    expect(poseEl.getAttribute('data-phase')).toBe('1')
  })

  it('floats only while in view', () => {
    const { poseEl } = mount()
    expect(poseEl.hasAttribute('data-inview')).toBe(false)
    setInView(poseEl, true)
    expect(poseEl.getAttribute('data-inview')).toBe('true')
    setInView(poseEl, false)
    expect(poseEl.getAttribute('data-inview')).toBe('false')
  })

  it('still picks a stable 0 or 1 phase when given neither index nor phase', () => {
    const { poseEl } = mount()
    expect(['0', '1']).toContain(poseEl.getAttribute('data-phase'))
  })
})

describe('scroll parallax', () => {
  it('computes 0.92x relative motion and clamps it to 24 px either way', () => {
    // Card centre at viewport centre: no offset.
    expect(parallaxOffset({ top: 250, height: 300 }, VIEWPORT)).toBeCloseTo(0)
    // Card centre 100 px below the viewport centre: the pose lags by (1 - 0.92) of that.
    expect(parallaxOffset({ top: 350, height: 300 }, VIEWPORT)).toBeCloseTo(-8)
    expect(parallaxOffset({ top: 3000, height: 300 }, VIEWPORT)).toBe(-24)
    expect(parallaxOffset({ top: -3000, height: 300 }, VIEWPORT)).toBe(24)
  })

  it('writes a clamped transform variable on scroll, in view only, throttled to one frame', () => {
    const scroll = listenerCounter(window, 'scroll')
    const { poseEl } = mount({}, { 'data-top': '3000', 'data-height': '400' })

    // Not in view yet: no listener, no work.
    expect(scroll.live()).toBe(0)

    setInView(poseEl, true)
    expect(scroll.live()).toBe(1)
    expect(scroll.added()[0]![2]).toMatchObject({ passive: true })

    // The in-view transition measures once; far below centre means the lower clamp.
    paintFrame()
    expect(poseEl.style.getPropertyValue('--pose-parallax')).toBe('-24px')

    // A burst of scroll events schedules exactly one frame.
    for (let i = 0; i < 5; i++) fireEvent.scroll(window)
    expect(frames.size).toBe(1)

    // The card moves to 100 px below the viewport centre: -8 px.
    const host = poseEl.closest<HTMLElement>('article')!
    host.dataset.top = '350'
    host.dataset.height = '300'
    paintFrame()
    expect(poseEl.style.getPropertyValue('--pose-parallax')).toBe('-8px')

    // Far above the viewport: upper clamp.
    host.dataset.top = '-3000'
    fireEvent.scroll(window)
    paintFrame()
    expect(poseEl.style.getPropertyValue('--pose-parallax')).toBe('24px')
  })

  it('stops listening and working as soon as it leaves the viewport', () => {
    const scroll = listenerCounter(window, 'scroll')
    const { poseEl, hostEl } = mount({}, { 'data-top': '350', 'data-height': '300' })
    setInView(poseEl, true)
    paintFrame()
    expect(scroll.live()).toBe(1)

    setInView(poseEl, false)
    expect(scroll.live()).toBe(0)

    const before = poseEl.style.getPropertyValue('--pose-parallax')
    hostEl.dataset.top = '3000'
    fireEvent.scroll(window)
    expect(frames.size).toBe(0)
    paintFrame()
    expect(poseEl.style.getPropertyValue('--pose-parallax')).toBe(before)
  })

  it('animates nothing but a CSS variable: no inline top, left, width, height or margin', () => {
    const { poseEl } = mount({}, { 'data-top': '350', 'data-height': '300' })
    setInView(poseEl, true)
    paintFrame()
    for (const prop of ['top', 'left', 'width', 'height', 'margin']) {
      expect(poseEl.style.getPropertyValue(prop), prop).toBe('')
    }
  })
})

describe('cleanup', () => {
  it('removes every listener, observer and pending frame on unmount', () => {
    const scroll = listenerCounter(window, 'scroll')
    const resize = listenerCounter(window, 'resize')
    const { poseEl, unmount } = mount({}, { 'data-top': '350' })

    setInView(poseEl, true)
    fireEvent.scroll(window)
    expect(scroll.live()).toBe(1)
    expect(resize.live()).toBe(1)
    expect(frames.size).toBeGreaterThan(0)

    unmount()

    expect(scroll.live()).toBe(0)
    expect(resize.live()).toBe(0)
    expect(frames.size).toBe(0)
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('removes the host listeners it added (hover and focus)', () => {
    const { hostEl, unmount } = mount()
    const spy = vi.spyOn(hostEl, 'removeEventListener')
    unmount()
    const removed = spy.mock.calls.map(([t]) => t)
    expect(removed).toEqual(
      expect.arrayContaining(['pointerenter', 'pointerleave', 'focusin', 'focusout']),
    )
  })
})

describe('hover and focus-visible', () => {
  it('lifts on hover of the nearest card and drops again on leave', () => {
    const { hostEl, poseEl } = mount()
    expect(poseEl.hasAttribute('data-active')).toBe(false)
    fireEvent(hostEl, new MouseEvent('pointerenter'))
    expect(poseEl.getAttribute('data-active')).toBe('true')
    fireEvent(hostEl, new MouseEvent('pointerleave'))
    expect(poseEl.getAttribute('data-active')).toBe('false')
  })

  it('alternates the tilt direction between neighbouring cards', () => {
    const { container } = render(
      <>
        {[0, 1, 2].map((i) => (
          <article key={i} data-testid={`card-${i}`}>
            <AnimatedPose image={IMAGE} sizes="50vw" index={i} />
          </article>
        ))}
      </>,
    )
    const tilts = [0, 1, 2].map((i) => {
      const card = container.querySelector<HTMLElement>(`[data-testid="card-${i}"]`)!
      fireEvent(card, new MouseEvent('pointerenter'))
      return pose(card).style.getPropertyValue('--pose-tilt')
    })
    expect(tilts).toEqual(['1', '-1', '1'])
  })

  it('lets an explicit tilt win over the index', () => {
    const { poseEl } = mount({ index: 0, tilt: -1 })
    expect(poseEl.style.getPropertyValue('--pose-tilt')).toBe('-1')
  })

  it('intensifies the stage glow through a CSS variable on the host and resets it', () => {
    const { hostEl } = mount()
    fireEvent(hostEl, new MouseEvent('pointerenter'))
    expect(hostEl.style.getPropertyValue('--pose-glow')).toBe('1')
    fireEvent(hostEl, new MouseEvent('pointerleave'))
    expect(hostEl.style.getPropertyValue('--pose-glow')).toBe('0')
  })

  it('ignores touch pointers so a tap does not leave a stuck hover', () => {
    const { hostEl, poseEl } = mount()
    const touch = new MouseEvent('pointerenter')
    Object.defineProperty(touch, 'pointerType', { value: 'touch' })
    fireEvent(hostEl, touch)
    expect(poseEl.hasAttribute('data-active')).toBe(false)
  })

  it('reacts to keyboard focus inside the card, not to mouse focus', () => {
    const view = render(
      <article data-testid="host">
        <button type="button">Go</button>
        <AnimatedPose image={IMAGE} sizes="50vw" />
      </article>,
    )
    const hostEl = view.getByTestId('host')
    const button = view.getByRole('button')
    const poseEl = pose(hostEl)

    const visible = vi.spyOn(button, 'matches').mockImplementation((s) => s === ':focus-visible')
    fireEvent.focusIn(button)
    expect(poseEl.getAttribute('data-active')).toBe('true')
    fireEvent.focusOut(button, { relatedTarget: document.body })
    expect(poseEl.getAttribute('data-active')).toBe('false')

    visible.mockImplementation(() => false)
    fireEvent.focusIn(button)
    expect(poseEl.getAttribute('data-active')).toBe('false')
  })

  it('falls back to its own box when it has no card around it', () => {
    const view = render(<AnimatedPose image={IMAGE} sizes="50vw" />)
    const el = view.container.querySelector<HTMLElement>('[data-animated-pose]')!
    fireEvent(el, new MouseEvent('pointerenter'))
    expect(el.getAttribute('data-active')).toBe('true')
  })
})

describe('reduced motion', () => {
  it('is static: no observers, no listeners, no hidden state, no hover', () => {
    media.set(true)
    const scroll = listenerCounter(window, 'scroll')
    const { poseEl, hostEl } = mount()

    expect(poseEl.getAttribute('data-motion')).toBe('static')
    expect(poseEl.getAttribute('data-reveal')).toBe('idle')
    expect(IO.instances).toHaveLength(0)
    expect(scroll.live()).toBe(0)

    fireEvent(hostEl, new MouseEvent('pointerenter'))
    expect(poseEl.hasAttribute('data-active')).toBe(false)
    expect(hostEl.style.getPropertyValue('--pose-glow')).toBe('')
  })

  it('switches everything off when the preference flips while the page is open', () => {
    const scroll = listenerCounter(window, 'scroll')
    const { poseEl } = mount({}, { 'data-top': '350' })
    setInView(poseEl, true)
    expect(scroll.live()).toBe(1)

    act(() => media.set(true))
    expect(scroll.live()).toBe(0)
    expect(poseEl.getAttribute('data-motion')).toBe('static')
  })
})
