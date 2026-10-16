import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY, removeMatchMedia } from './layout-test-utils'

// The overlay is loaded with next/dynamic in the app so the player stays out of the first visit's
// bundle for everyone who does not play it. Under test the loader is resolved synchronously, which
// keeps the real overlay in play without racing the fake timers.
vi.mock('next/dynamic', async () => {
  const { LogoIntroOverlay } = await import('../../src/components/brand/logo-intro-overlay')
  return { default: () => LogoIntroOverlay }
})

// The real player needs lottie-web and fetch. What the overlay depends on is only the box it
// renders and the data-lottie-state attribute the player maintains on it.
const player = vi.hoisted(() => ({ state: 'ready' as 'ready' | 'loading' | 'error' }))
vi.mock('../../src/components/motion/LottiePlayer', async () => {
  const { createElement } = await import('react')
  return {
    LottiePlayer: (props: { src: string }) =>
      createElement('div', {
        'data-testid': 'lottie',
        'data-src': props.src,
        'data-lottie-state': player.state,
      }),
  }
})

import { LogoIntro } from '../../src/components/brand/logo-intro'

const overlay = () => document.querySelector<HTMLElement>('[data-slot="logo-intro"]')
const stage = () => document.querySelector<HTMLElement>('[data-slot="logo-intro-stage"]')
const backdrop = () => document.querySelector<HTMLElement>('[data-slot="logo-intro-backdrop"]')

function setWebdriver(value: boolean | undefined) {
  Object.defineProperty(navigator, 'webdriver', { value, configurable: true })
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

let target: HTMLElement

beforeEach(() => {
  vi.useFakeTimers()
  window.sessionStorage.clear()
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
  setWebdriver(false)
  player.state = 'ready'
  target = document.createElement('a')
  target.setAttribute('data-logo-intro-target', '')
  document.body.appendChild(target)
})

afterEach(() => {
  cleanup()
  target.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  // @ts-expect-error restore jsdom, which has no Web Animations API
  delete Element.prototype.animate
})

describe('LogoIntro server render', () => {
  it('renders nothing, so the SSR HTML and the LCP candidate are untouched', () => {
    expect(renderToString(<LogoIntro enabled />)).toBe('')
  })
})

describe('LogoIntro gate', () => {
  it('plays on the first visit: an aria-hidden overlay with the stacked logo Lottie', () => {
    render(<LogoIntro enabled />)
    expect(overlay()).not.toBeNull()
    expect(overlay()!.getAttribute('aria-hidden')).toBe('true')
    expect(overlay()!.querySelector('[data-testid="lottie"]')!.getAttribute('data-src')).toBe(
      '/lottie/sineva-logo-intro.json',
    )
  })

  it('never traps focus: nothing inside the overlay is focusable', () => {
    render(<LogoIntro enabled />)
    expect(
      overlay()!.querySelectorAll('a, button, input, select, textarea, [tabindex]').length,
    ).toBe(0)
  })

  it('claims the session slot so a reload in the same session does not replay', () => {
    const first = render(<LogoIntro enabled />)
    expect(overlay()).not.toBeNull()
    first.unmount()
    render(<LogoIntro enabled />)
    expect(overlay()).toBeNull()
  })

  it('plays once under StrictMode, which runs effects twice in development', () => {
    render(
      <StrictMode>
        <LogoIntro enabled />
      </StrictMode>,
    )
    expect(overlay()).not.toBeNull()
  })

  it('shows no overlay under prefers-reduced-motion', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    render(<LogoIntro enabled />)
    expect(overlay()).toBeNull()
  })

  it('shows no overlay to automated browsers (navigator.webdriver)', () => {
    setWebdriver(true)
    render(<LogoIntro enabled />)
    expect(overlay()).toBeNull()
  })

  it('shows the overlay to an automated browser only when the test-only force flag is on', () => {
    setWebdriver(true)
    render(<LogoIntro enabled force />)
    expect(overlay()).not.toBeNull()
  })

  it('shows no overlay when the site toggle is off', () => {
    render(<LogoIntro enabled={false} />)
    expect(overlay()).toBeNull()
  })

  it('shows no overlay when the session already saw it', () => {
    window.sessionStorage.setItem('sineva:once:logo-intro', '1')
    render(<LogoIntro enabled />)
    expect(overlay()).toBeNull()
  })

  it('shows no overlay, and does not throw, when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(() => render(<LogoIntro enabled />)).not.toThrow()
    expect(overlay()).toBeNull()
  })

  it('still works when matchMedia is missing', () => {
    removeMatchMedia()
    render(<LogoIntro enabled />)
    expect(overlay()).not.toBeNull()
  })
})

describe('LogoIntro skip rules', () => {
  it.each([
    ['keydown', (el: Element) => fireEvent.keyDown(el, { key: 'Tab' })],
    ['wheel', (el: Element) => fireEvent.wheel(el, { deltaY: 40 })],
    ['touchstart', (el: Element) => fireEvent.touchStart(el)],
    ['pointerdown', (el: Element) => fireEvent.pointerDown(el)],
  ])('skips immediately on %s', (_name, fire) => {
    render(<LogoIntro enabled />)
    expect(overlay()).not.toBeNull()
    act(() => {
      fire(document.body)
    })
    expect(overlay()).toBeNull()
  })

  it('does not swallow the key press that skips it', () => {
    render(<LogoIntro enabled />)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    act(() => {
      document.body.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
    expect(overlay()).toBeNull()
  })

  it('stops listening once it is gone', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    render(<LogoIntro enabled />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'a' })
    })
    const removed = remove.mock.calls.map(([type]) => type)
    for (const type of ['keydown', 'wheel', 'touchstart', 'pointerdown']) {
      expect(removed).toContain(type)
    }
  })

  it('disappears when the visitor turns reduced motion on mid-play', () => {
    const media = installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
    render(<LogoIntro enabled />)
    expect(overlay()).not.toBeNull()
    act(() => media.set(REDUCED_MOTION_QUERY, true))
    expect(overlay()).toBeNull()
  })
})

describe('LogoIntro timing', () => {
  it('blocks pointer input until 1.2 s, then lets it through', () => {
    render(<LogoIntro enabled />)
    advance(1199)
    expect(overlay()!.style.pointerEvents).not.toBe('none')
    advance(1)
    expect(overlay()!.style.pointerEvents).toBe('none')
  })

  it('unmounts at the 1.6 s cap, not before', () => {
    render(<LogoIntro enabled />)
    advance(1599)
    expect(overlay()).not.toBeNull()
    advance(1)
    expect(overlay()).toBeNull()
  })

  it('never waits for the network: gives up when the Lottie is not ready in time', () => {
    player.state = 'loading'
    render(<LogoIntro enabled />)
    // Mounted but invisible and inert while the player loads, so the page is never hidden for nothing.
    expect(overlay()!.dataset.state).toBe('pending')
    expect(overlay()!.style.pointerEvents).toBe('none')
    advance(600)
    expect(overlay()).toBeNull()
  })

  it('gives up at once when the Lottie fails to load', () => {
    player.state = 'error'
    render(<LogoIntro enabled />)
    expect(overlay()).toBeNull()
  })

  it('becomes visible as soon as the player reports ready', () => {
    render(<LogoIntro enabled />)
    expect(overlay()!.dataset.state).toBe('live')
  })
})

describe('LogoIntro hand-off', () => {
  function rectFor(el: Element): DOMRect {
    const box = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect
    if (el === target) return box(24, 20, 120, 28)
    if (el.matches('[data-slot="logo-intro-stage"]')) return box(400, 300, 200, 200)
    return box(0, 0, 0, 0)
  }

  it('hides the real navbar logo while the overlay is up and restores it afterwards', () => {
    render(<LogoIntro enabled />)
    expect(target.style.opacity).toBe('0')
    advance(1600)
    expect(target.style.opacity).toBe('')
  })

  it('restores the navbar logo when the intro is skipped', () => {
    render(<LogoIntro enabled />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    expect(target.style.opacity).toBe('')
  })

  it('runs the FLIP flight and the backdrop fade with transform and opacity only', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return rectFor(this)
    })
    const animate = vi.fn(() => ({ cancel: vi.fn() }))
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true })

    render(<LogoIntro enabled />)
    expect(animate).not.toHaveBeenCalled()
    advance(1100)

    const calls = animate.mock.calls as unknown as Array<[Keyframe[], KeyframeAnimationOptions]>
    expect(calls.length).toBe(2)

    const flight = calls.find(([frames]) => 'transform' in frames[frames.length - 1])!
    expect(flight[1].duration).toBe(500)
    expect(flight[1].easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)')
    expect(flight[0][flight[0].length - 1].transform).toMatch(
      /^translate\(-?[\d.]+px, -?[\d.]+px\) scale\(/,
    )

    const fade = calls.find(([frames]) => 'opacity' in frames[frames.length - 1])!
    expect(fade[1].duration).toBe(200)

    for (const [frames] of calls) {
      for (const frame of frames) {
        const animated = Object.keys(frame).filter((k) => k !== 'offset' && k !== 'easing')
        expect(animated.every((k) => k === 'transform' || k === 'opacity')).toBe(true)
      }
    }
  })

  it('fades the whole overlay instead of flying when the navbar logo is off screen', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this === target) return { left: 24, top: -90, width: 120, height: 28 } as DOMRect
      return rectFor(this)
    })
    const animate = vi.fn(() => ({ cancel: vi.fn() }))
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true })

    render(<LogoIntro enabled />)
    advance(1100)
    const calls = animate.mock.calls as unknown as Array<[Keyframe[], KeyframeAnimationOptions]>
    expect(calls.some(([frames]) => 'transform' in frames[frames.length - 1])).toBe(false)
    expect(stage()).not.toBeNull()
    expect(backdrop()).not.toBeNull()
  })

  it('still unmounts at the cap in a browser without the Web Animations API', () => {
    render(<LogoIntro enabled />)
    advance(1100)
    expect(overlay()).not.toBeNull()
    advance(500)
    expect(overlay()).toBeNull()
  })
})
