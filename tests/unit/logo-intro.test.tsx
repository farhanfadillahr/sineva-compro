import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY } from './layout-test-utils'

// The overlay is loaded with next/dynamic in the app so the player stays out of the bundle of
// everyone who does not play the intro. Under test the loader is resolved synchronously, which
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

const html = document.documentElement
const marker = () => html.dataset.logoIntro
const stage = () => document.querySelector<HTMLElement>('[data-slot="logo-intro-stage"]')
const mark = () => {
  html.dataset.logoIntro = 'pending'
}

// The intro timeline is anchored to navigation start (performance.now()), because the server
// rendered shell and its CSS safety timers start at first paint, not when React mounts. The clock
// is controlled here so a test can say "React mounted 300 ms into the page".
let now = 0
function advance(ms: number) {
  now += ms
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

let target: HTMLElement

beforeEach(() => {
  vi.useFakeTimers()
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  window.sessionStorage.clear()
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
  player.state = 'ready'
  delete html.dataset.logoIntro
  target = document.createElement('a')
  target.setAttribute('data-logo-intro-target', '')
  document.body.appendChild(target)
})

afterEach(() => {
  cleanup()
  target.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete html.dataset.logoIntro
  // @ts-expect-error restore jsdom, which has no Web Animations API
  delete Element.prototype.animate
})

describe('LogoIntro server render', () => {
  it('renders nothing, so the SSR HTML and the LCP candidate are untouched', () => {
    mark()
    expect(renderToString(<LogoIntro />)).toBe('')
  })
})

describe('LogoIntro takeover', () => {
  it('does nothing unless the gate marked the document pending', () => {
    render(<LogoIntro />)
    expect(stage()).toBeNull()
    expect(marker()).toBeUndefined()
  })

  it.each(['', 'done', 'PENDING'])('ignores the marker value %j', (value) => {
    html.dataset.logoIntro = value
    render(<LogoIntro />)
    expect(stage()).toBeNull()
    expect(marker()).toBe(value)
  })

  it('mounts the stacked logo Lottie when the document is pending, and keeps the marker meanwhile', () => {
    mark()
    render(<LogoIntro />)
    expect(stage()).not.toBeNull()
    expect(stage()!.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(stage()!.querySelector('[data-testid="lottie"]')!.getAttribute('data-src')).toBe(
      '/lottie/sineva-logo-intro.json',
    )
    expect(marker()).toBe('pending')
  })

  it('never traps focus: nothing in the layer is focusable', () => {
    mark()
    render(<LogoIntro />)
    const root = document.querySelector('[data-slot="logo-intro"]')!
    expect(root.querySelectorAll('a, button, input, select, textarea, [tabindex]').length).toBe(0)
  })

  it('does not touch the session flag: the gate script already claimed it', () => {
    mark()
    render(<LogoIntro />)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('plays once under StrictMode, which runs effects twice in development', () => {
    mark()
    render(
      <StrictMode>
        <LogoIntro />
      </StrictMode>,
    )
    expect(stage()).not.toBeNull()
    expect(marker()).toBe('pending')
  })
})

describe('LogoIntro releases the shell', () => {
  it('removes the marker and unmounts at the 1.6 s cap, not before', () => {
    mark()
    render(<LogoIntro />)
    advance(1599)
    expect(stage()).not.toBeNull()
    advance(1)
    expect(stage()).toBeNull()
    expect(marker()).toBeUndefined()
  })

  it('removes the marker when the Lottie fails to load', () => {
    player.state = 'error'
    mark()
    render(<LogoIntro />)
    expect(marker()).toBeUndefined()
    expect(stage()).toBeNull()
  })

  it('never waits for the network: removes the marker when the Lottie is not ready in 500 ms', () => {
    player.state = 'loading'
    mark()
    render(<LogoIntro />)
    advance(499)
    expect(marker()).toBe('pending')
    advance(1)
    expect(marker()).toBeUndefined()
    expect(stage()).toBeNull()
  })

  it('removes the marker when it mounts too late for the intro to finish within the cap', () => {
    now = 801
    mark()
    render(<LogoIntro />)
    expect(marker()).toBeUndefined()
    expect(stage()).toBeNull()
  })

  it('removes the marker when the visitor turns reduced motion on mid-play', () => {
    const media = installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
    mark()
    render(<LogoIntro />)
    act(() => media.set(REDUCED_MOTION_QUERY, true))
    expect(marker()).toBeUndefined()
    expect(stage()).toBeNull()
  })

  it.each([
    ['keydown', (el: Element) => fireEvent.keyDown(el, { key: 'Tab' })],
    ['wheel', (el: Element) => fireEvent.wheel(el, { deltaY: 40 })],
    ['touchstart', (el: Element) => fireEvent.touchStart(el)],
    ['pointerdown', (el: Element) => fireEvent.pointerDown(el)],
  ])('skips immediately on %s', (_name, fire) => {
    mark()
    render(<LogoIntro />)
    act(() => {
      fire(document.body)
    })
    expect(marker()).toBeUndefined()
    expect(stage()).toBeNull()
  })

  it('does not swallow the key press that skips it', () => {
    mark()
    render(<LogoIntro />)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    act(() => {
      document.body.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
    expect(marker()).toBeUndefined()
  })

  it('stops listening once it is gone', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    mark()
    render(<LogoIntro />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'a' })
    })
    const removed = remove.mock.calls.map(([type]) => type)
    for (const type of ['keydown', 'wheel', 'touchstart', 'pointerdown']) {
      expect(removed).toContain(type)
    }
  })

  it('does not react to input once finished', () => {
    mark()
    render(<LogoIntro />)
    advance(1600)
    html.dataset.logoIntro = 'pending' // e.g. a later gate run; must not be released by stale listeners
    act(() => {
      fireEvent.keyDown(document.body, { key: 'a' })
    })
    expect(marker()).toBe('pending')
  })
})

describe('LogoIntro timeline', () => {
  it('keeps the shell up until the hand-off at 1.1 s, then releases it so it fades 200 ms', () => {
    mark()
    render(<LogoIntro />)
    advance(1099)
    expect(marker()).toBe('pending')
    advance(1)
    expect(marker()).toBeUndefined()
    // The flying logo stays until the cap.
    expect(stage()).not.toBeNull()
  })

  it('anchors the timeline to navigation start, not to when React mounted', () => {
    now = 300
    mark()
    render(<LogoIntro />)
    advance(799)
    expect(marker()).toBe('pending')
    advance(1)
    expect(marker()).toBeUndefined()
    advance(499)
    expect(stage()).not.toBeNull()
    advance(1)
    expect(stage()).toBeNull()
  })

  it('hides the real navbar logo while the intro plays and restores it afterwards', () => {
    mark()
    render(<LogoIntro />)
    expect(target.style.opacity).toBe('0')
    advance(1600)
    expect(target.style.opacity).toBe('')
  })

  it('restores the navbar logo when the intro is skipped', () => {
    mark()
    render(<LogoIntro />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    expect(target.style.opacity).toBe('')
  })

  const rectFor = (el: Element, targetRect: Partial<DOMRect>): DOMRect => {
    const box = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect
    if (el === target) return { ...box(24, 20, 120, 28), ...targetRect } as DOMRect
    if (el.matches('[data-slot="logo-intro-stage"]')) return box(400, 300, 200, 200)
    return box(0, 0, 0, 0)
  }
  const stubAnimate = () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }))
    Object.defineProperty(Element.prototype, 'animate', { value: animate, configurable: true })
    return animate
  }

  it('flies the logo to the navbar slot in 500 ms with ease-out-expo, transform only', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return rectFor(this, {})
    })
    const animate = stubAnimate()
    mark()
    render(<LogoIntro />)
    expect(animate).not.toHaveBeenCalled()
    advance(1100)
    expect(animate).toHaveBeenCalledTimes(1)
    const [frames, options] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ]
    expect(options.duration).toBe(500)
    expect(options.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)')
    for (const frame of frames) {
      const animated = Object.keys(frame).filter((k) => k !== 'offset' && k !== 'easing')
      expect(animated).toEqual(['transform'])
    }
    expect(frames[frames.length - 1].transform).toMatch(
      /^translate\(-?[\d.]+px, -?[\d.]+px\) scale\(/,
    )
  })

  it('fades the logo with the shell instead of flying when the navbar logo is off screen', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return rectFor(this, { top: -90 })
    })
    const animate = stubAnimate()
    mark()
    render(<LogoIntro />)
    advance(1100)
    const calls = animate.mock.calls as unknown as Array<[Keyframe[], KeyframeAnimationOptions]>
    expect(calls.some(([frames]) => 'transform' in frames[frames.length - 1])).toBe(false)
    expect(calls.every(([frames]) => 'opacity' in frames[frames.length - 1])).toBe(true)
  })

  it('still finishes at the cap in a browser without the Web Animations API', () => {
    mark()
    render(<LogoIntro />)
    advance(1600)
    expect(stage()).toBeNull()
    expect(marker()).toBeUndefined()
  })
})
