import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY } from './layout-test-utils'
import {
  SPLASH_CLIP,
  SPLASH_TIMING,
  wipeClipPath,
} from '../../src/components/brand/splash-sequence'

// The first-load splash sequence (docs/design/motion.md section 3.1), end to end through the
// takeover: cover, Sino stands and ignites, the lift, the wipe, and every way out. The overlay is
// loaded with next/dynamic in the app; under test the loader resolves synchronously, which keeps
// the real overlay in play without racing the fake timers. `chunk.broken` simulates a chunk that
// never loads.
const chunk = vi.hoisted(() => ({ broken: false }))
vi.mock('next/dynamic', async () => {
  const { LogoIntroOverlay } = await import('../../src/components/brand/logo-intro-overlay')
  const { createElement } = await import('react')
  return {
    default: () => (props: Parameters<typeof LogoIntroOverlay>[0]) =>
      chunk.broken ? null : createElement(LogoIntroOverlay, props),
  }
})

import { LogoIntro } from '../../src/components/brand/logo-intro'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const html = document.documentElement
const marker = () => html.dataset.logoIntro
const mark = () => {
  html.dataset.logoIntro = 'pending'
}
const root = () => document.querySelector<HTMLElement>('[data-slot="logo-intro"]')
const slot = () => document.querySelector<HTMLElement>('[data-slot="logo-intro-launch"]')
const attached = () => slot()?.querySelector('video') ?? null

// The sequence clock is performance.now() (navigation start), because the server-rendered shell and
// its CSS timers start at first paint, not when React mounts. Tests say "React mounted 300 ms into
// the page" by moving this value.
let now = 0
function advance(ms: number) {
  now += ms
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

type Recorded = {
  el: Element
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  cancel: ReturnType<typeof vi.fn>
}
let animations: Recorded[]
let created: HTMLVideoElement[]
let canWebm: boolean
let play: ReturnType<typeof vi.spyOn>

const preloaded = () => created.find((v) => v.getAttribute('src')) ?? null

function becomeReady(video: HTMLVideoElement | null = preloaded()) {
  Object.defineProperty(video!, 'readyState', { value: 4, configurable: true })
  act(() => {
    video!.dispatchEvent(new Event('canplaythrough'))
  })
}
function setClipTime(ms: number, video: HTMLVideoElement | null = preloaded()) {
  Object.defineProperty(video!, 'currentTime', { value: ms / 1000, configurable: true })
}
/** Ready, adopted and presenting its first frame, as a browser with a cached clip would be. */
function startClip(video: HTMLVideoElement | null = preloaded()) {
  becomeReady(video)
  act(() => {
    video!.dispatchEvent(new Event('playing'))
  })
}
/** Move the clip clock to `ms` and let the poll see it. */
function clipAt(ms: number) {
  setClipTime(ms)
  advance(SPLASH_TIMING.pollMs)
}
const lastWipe = () => animations.at(-1)

beforeEach(() => {
  vi.useFakeTimers()
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
  chunk.broken = false
  canWebm = true
  delete html.dataset.logoIntro
  html.removeAttribute('style')
  html.removeAttribute('data-logo-intro-live')
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(CHROME_UA)
  Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
  Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true })
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation((type) =>
    type.includes('webm') && canWebm ? 'maybe' : '',
  )
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  created = []
  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    const element = realCreate(tag, options)
    if (tag === 'video') created.push(element as HTMLVideoElement)
    return element
  }) as typeof document.createElement)
  // jsdom has no Web Animations API: record what the sequence asks the browser to animate.
  animations = []
  Element.prototype.animate = function (
    this: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const cancel = vi.fn()
    animations.push({ el: this, keyframes, options, cancel })
    return { cancel } as unknown as Animation
  } as typeof Element.prototype.animate
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete html.dataset.logoIntro
  html.removeAttribute('style')
  html.removeAttribute('data-logo-intro-live')
  Reflect.deleteProperty(performance, 'mark')
  // @ts-expect-error restore jsdom, which has no Web Animations API
  delete Element.prototype.animate
})

describe('server render and takeover gate', () => {
  it('renders nothing on the server, so the SSR HTML and the LCP candidate are untouched', () => {
    mark()
    expect(renderToString(<LogoIntro />)).toBe('')
  })

  it('does nothing unless the gate marked the document pending: no overlay, no fetch, no lock', () => {
    render(<LogoIntro />)
    expect(root()).toBeNull()
    expect(created).toHaveLength(0)
    expect(html.style.overflow).toBe('')
    expect(marker()).toBeUndefined()
  })

  it.each(['', 'done', 'PENDING'])('ignores the marker value %j', (value) => {
    html.dataset.logoIntro = value
    render(<LogoIntro />)
    expect(root()).toBeNull()
    expect(marker()).toBe(value)
  })

  it('does not touch the session flag: the gate script never wrote one either', () => {
    mark()
    render(<LogoIntro />)
    expect(window.sessionStorage.length).toBe(0)
  })

  it.each([
    ['reduced motion', () => installMatchMedia({ [REDUCED_MOTION_QUERY]: true })],
    [
      'Save-Data',
      () =>
        Object.defineProperty(navigator, 'connection', {
          value: { saveData: true },
          configurable: true,
        }),
    ],
  ])('opens the page at once under %s: no overlay, no clip, no lock', (_name, arrange) => {
    arrange()
    mark()
    render(<LogoIntro />)
    expect(root()).toBeNull()
    expect(created).toHaveLength(0)
    expect(marker()).toBeUndefined()
    expect(html.style.overflow).toBe('')
  })
})

describe('the overlay while it covers', () => {
  it('is a decorative full-screen layer with Sino slot and nothing focusable', () => {
    mark()
    render(<LogoIntro />)
    expect(root()!.getAttribute('aria-hidden')).toBe('true')
    expect(slot()).not.toBeNull()
    expect(root()!.querySelectorAll('a, button, input, select, textarea, [tabindex]').length).toBe(
      0,
    )
  })

  it('has no logo, no Lottie and no flight', () => {
    mark()
    render(<LogoIntro />)
    expect(document.querySelector('[data-lottie-state]')).toBeNull()
    expect(document.querySelector('[data-slot="logo-intro-stage"]')).toBeNull()
    expect(animations).toHaveLength(0)
  })

  it('locks scroll and keeps the marker, so the shell and the hero wait', () => {
    mark()
    render(<LogoIntro />)
    expect(html.style.overflow).toBe('hidden')
    expect(marker()).toBe('pending')
  })

  it('hands the cover from the shell to itself, so the shell can never be in the way of the wipe', () => {
    mark()
    render(<LogoIntro />)
    expect(html.hasAttribute('data-logo-intro-live')).toBe(true)
  })

  it('starts the download when the takeover mounts, before the overlay needs it', () => {
    mark()
    render(<LogoIntro />)
    expect(preloaded()!.getAttribute('src')).toBe('/mascot/launch/sino-launch.webm')
    expect(attached()).toBeNull()
    expect(play).not.toHaveBeenCalled()
  })

  it('does not open the page while the clip is not ready, whatever happens to the time before 2.5 s', () => {
    mark()
    render(<LogoIntro />)
    advance(SPLASH_TIMING.noVideoDeadlineMs - 1)
    expect(root()).not.toBeNull()
    expect(animations).toHaveLength(0)
    expect(marker()).toBe('pending')
  })
})

describe('the sequence: Sino stands, ignites, lifts, the page opens from the bottom up', () => {
  it('plays the clip in the slot as soon as it is ready, and keeps covering while she stands', () => {
    mark()
    render(<LogoIntro />)
    advance(300)
    becomeReady()
    expect(attached()).toBe(preloaded())
    expect(play).toHaveBeenCalledTimes(1)
    startClip()
    clipAt(0)
    clipAt(200)
    clipAt(SPLASH_CLIP.liftMs - 1)
    expect(animations).toHaveLength(0)
    expect(root()).not.toBeNull()
  })

  it('plays at once when the file was already ready by the time the overlay mounted', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
    mark()
    render(<LogoIntro />)
    expect(attached()).not.toBeNull()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('starts the wipe at the measured lift moment: clip-path from covering to open, bottom to top', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    expect(animations).toHaveLength(1)
    const wipe = lastWipe()!
    expect(wipe.el).toBe(root())
    expect(wipe.keyframes).toEqual([{ clipPath: wipeClipPath(0) }, { clipPath: wipeClipPath(1) }])
    expect(wipe.options.duration).toBe(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs)
    expect(wipe.options.easing).toBe('linear')
    expect(wipe.options.fill).toBe('forwards')
  })

  it('animates clip-path and nothing else', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    for (const frame of lastWipe()!.keyframes) {
      expect(Object.keys(frame).filter((k) => k !== 'offset')).toEqual(['clipPath'])
    }
  })

  it('derives the wipe from the clip clock, not from a timer: a late poll starts part way in', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    const late = SPLASH_CLIP.liftMs + 110
    clipAt(late)
    const wipe = lastWipe()!
    const window = SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs
    expect(wipe.keyframes[0]).toEqual({ clipPath: wipeClipPath(110 / window) })
    expect(wipe.options.duration).toBe(SPLASH_CLIP.exitMs - late)
  })

  it('does not run the wipe on a clip that advances slowly: it waits for the lift, not the clock', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    for (let t = 0; t < SPLASH_CLIP.liftMs; t += 100) clipAt(t)
    advance(100)
    expect(animations).toHaveLength(0)
  })

  it('opens the page only after the animation: the overlay, the lock and the marker stay until it ends', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    const duration = lastWipe()!.options.duration as number
    advance(duration - 1)
    expect(root()).not.toBeNull()
    expect(html.style.overflow).toBe('hidden')
    expect(marker()).toBe('pending')
    advance(1)
    expect(root()).toBeNull()
    expect(html.style.overflow).toBe('')
    expect(marker()).toBeUndefined()
    expect(html.hasAttribute('data-logo-intro-live')).toBe(false)
  })

  it('ends the wipe where the clip has her leave the top, before the clip itself ends', () => {
    expect(SPLASH_CLIP.exitMs).toBeLessThanOrEqual(SPLASH_CLIP.durationMs)
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    advance(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs)
    expect(root()).toBeNull()
  })

  it('disposes the clip with the overlay: paused, source emptied, element removed', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    const video = attached()!
    clipAt(SPLASH_CLIP.liftMs)
    advance(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs)
    expect(document.contains(video)).toBe(false)
    expect(video.hasAttribute('src')).toBe(false)
  })

  it('keeps the marker, and so the hero wave, waiting for the end of the wipe, then releases it', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    advance(200)
    expect(marker()).toBe('pending')
    advance(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs - 200)
    expect(marker()).toBeUndefined()
  })

  it('wipes once even if the clip clock keeps moving', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    clipAt(SPLASH_CLIP.liftMs + 50)
    clipAt(SPLASH_CLIP.liftMs + 100)
    expect(animations).toHaveLength(1)
  })

  it('plays once under StrictMode, which runs effects twice in development', () => {
    mark()
    render(
      <StrictMode>
        <LogoIntro />
      </StrictMode>,
    )
    const video = created.filter((v) => v.getAttribute('src')).at(-1)!
    startClip(video)
    clipAt(SPLASH_CLIP.liftMs)
    expect(document.querySelectorAll('video')).toHaveLength(1)
    expect(play).toHaveBeenCalledTimes(1)
    expect(animations).toHaveLength(1)
    advance(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs)
    expect(root()).toBeNull()
    expect(html.style.overflow).toBe('')
  })
})

describe('scroll lock', () => {
  it('puts back the inline overflow that was there before, when the wipe ends', () => {
    html.style.overflow = 'scroll'
    mark()
    render(<LogoIntro />)
    expect(html.style.overflow).toBe('hidden')
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    advance(SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs)
    expect(html.style.overflow).toBe('scroll')
  })

  it('is restored on skip, on the hard stop and on unmount', () => {
    mark()
    const first = render(<LogoIntro />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' })
    })
    advance(SPLASH_TIMING.skipWipeMs)
    expect(html.style.overflow).toBe('')
    first.unmount()

    now = 0
    mark()
    const second = render(<LogoIntro />)
    advance(SPLASH_TIMING.hardStopMs)
    expect(html.style.overflow).toBe('')
    second.unmount()

    now = 0
    mark()
    const third = render(<LogoIntro />)
    expect(html.style.overflow).toBe('hidden')
    third.unmount()
    expect(html.style.overflow).toBe('')
  })
})

describe('input', () => {
  it.each([
    ['keydown', (el: Element) => fireEvent.keyDown(el, { key: 'Tab' })],
    ['wheel', (el: Element) => fireEvent.wheel(el, { deltaY: 40 })],
    ['touchstart', (el: Element) => fireEvent.touchStart(el)],
    ['pointerdown', (el: Element) => fireEvent.pointerDown(el)],
  ])('%s skips: a fast wipe from the top of the page, then done', (_name, fire) => {
    mark()
    render(<LogoIntro />)
    advance(300)
    startClip()
    act(() => {
      fire(document.body)
    })
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.keyframes[0]).toEqual({ clipPath: wipeClipPath(0) })
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.skipWipeMs)
    advance(SPLASH_TIMING.skipWipeMs - 1)
    expect(root()).not.toBeNull()
    advance(1)
    expect(root()).toBeNull()
    expect(marker()).toBeUndefined()
  })

  it('speeds up a wipe that is already running, continuing from where it is', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    const lift = lastWipe()!
    const window = SPLASH_CLIP.exitMs - SPLASH_CLIP.liftMs
    advance(window / 2)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Enter' })
    })
    expect(lift.cancel).toHaveBeenCalled()
    const fast = lastWipe()!
    expect(fast).not.toBe(lift)
    expect(fast.keyframes[0]).toEqual({ clipPath: wipeClipPath(0.5) })
    expect(fast.options.duration).toBe(SPLASH_TIMING.skipWipeMs / 2)
    advance(SPLASH_TIMING.skipWipeMs / 2)
    expect(root()).toBeNull()
  })

  it('skips only once: a second key during the fast wipe changes nothing', () => {
    mark()
    render(<LogoIntro />)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'a' })
    })
    act(() => {
      fireEvent.keyDown(document.body, { key: 'b' })
    })
    expect(animations).toHaveLength(1)
  })

  it('does not consume the key, so Tab still lands on the skip link once the cover is gone', () => {
    mark()
    render(<LogoIntro />)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    act(() => {
      document.body.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
  })

  it('blocks clicks from reaching the page while the overlay is up', () => {
    mark()
    render(<LogoIntro />)
    const button = document.createElement('button')
    const onClick = vi.fn()
    button.addEventListener('click', onClick)
    document.body.appendChild(button)
    act(() => {
      fireEvent.click(button)
    })
    expect(onClick).not.toHaveBeenCalled()
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    advance(SPLASH_TIMING.skipWipeMs)
    act(() => {
      fireEvent.click(button)
    })
    expect(onClick).toHaveBeenCalledTimes(1)
    button.remove()
  })

  it('opens at once, with no wipe, when the visitor turns reduced motion on mid-splash', () => {
    const media = installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
    mark()
    render(<LogoIntro />)
    startClip()
    const video = attached()!
    act(() => media.set(REDUCED_MOTION_QUERY, true))
    expect(root()).toBeNull()
    expect(document.contains(video)).toBe(false)
    expect(marker()).toBeUndefined()
    expect(html.style.overflow).toBe('')
  })
})

describe('never stuck: no video within 2.5 s', () => {
  it('wipes upward in 400 ms without Sino when the clip has not started by 2.5 s', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    advance(SPLASH_TIMING.noVideoDeadlineMs - 1)
    expect(animations).toHaveLength(0)
    advance(1)
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.keyframes).toEqual([
      { clipPath: wipeClipPath(0) },
      { clipPath: wipeClipPath(1) },
    ])
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.fallbackWipeMs)
    // The download is cancelled and Sino never appears, even if the file turns up now.
    expect(video.hasAttribute('src')).toBe(false)
    expect(attached()).toBeNull()
    advance(SPLASH_TIMING.fallbackWipeMs)
    expect(root()).toBeNull()
    expect(marker()).toBeUndefined()
    expect(html.style.overflow).toBe('')
  })

  it('counts from navigation start, not from when React mounted', () => {
    now = 2100
    mark()
    render(<LogoIntro />)
    advance(399)
    expect(animations).toHaveLength(0)
    advance(1)
    expect(animations).toHaveLength(1)
  })

  it('wipes at once when the overlay mounts after the deadline', () => {
    now = 2600
    mark()
    render(<LogoIntro />)
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.fallbackWipeMs)
    expect(attached()).toBeNull()
  })

  it('does not fire once the clip is playing, even when it started at 2.4 s', () => {
    mark()
    render(<LogoIntro />)
    advance(2400)
    startClip()
    advance(200)
    expect(animations).toHaveLength(0)
    expect(attached()).not.toBeNull()
  })

  it('runs the same fallback when there is no clip at all (no playable encoding)', () => {
    canWebm = false
    mark()
    render(<LogoIntro />)
    expect(preloaded()).toBeNull()
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.fallbackWipeMs)
    advance(SPLASH_TIMING.fallbackWipeMs)
    expect(root()).toBeNull()
  })
})

describe('never stuck: the clip fails or stalls', () => {
  it('wipes at once when the file errors before it started', () => {
    mark()
    render(<LogoIntro />)
    act(() => {
      preloaded()!.dispatchEvent(new Event('error'))
    })
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.skipWipeMs)
    advance(SPLASH_TIMING.skipWipeMs)
    expect(root()).toBeNull()
  })

  it('wipes at once when play() is refused', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
    mark()
    render(<LogoIntro />)
    becomeReady()
    await act(async () => {
      await Promise.resolve()
    })
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.skipWipeMs)
  })

  it('wipes at once when the clip clock stops while she stands', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(200)
    advance(SPLASH_TIMING.stallMs - SPLASH_TIMING.pollMs * 2)
    expect(animations).toHaveLength(0)
    advance(SPLASH_TIMING.pollMs * 3)
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.skipWipeMs)
  })

  it('speeds up a running lift wipe when the clip stalls mid-flight', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    clipAt(SPLASH_CLIP.liftMs)
    const lift = lastWipe()!
    advance(SPLASH_TIMING.stallMs + SPLASH_TIMING.pollMs)
    // Whether the lift wipe had already finished by then is covered by its own duration; if it was
    // still running, the stall replaced it with a fast one.
    if (root()) {
      expect(lift.cancel).toHaveBeenCalled()
      expect(lastWipe()!.options.duration).toBeLessThanOrEqual(SPLASH_TIMING.skipWipeMs)
    }
    advance(SPLASH_TIMING.skipWipeMs)
    expect(root()).toBeNull()
  })

  it('wipes at once when the clip ends before the lift moment', () => {
    mark()
    render(<LogoIntro />)
    startClip()
    act(() => {
      attached()!.dispatchEvent(new Event('ended'))
    })
    expect(animations).toHaveLength(1)
    expect(lastWipe()!.options.duration).toBe(SPLASH_TIMING.skipWipeMs)
  })
})

describe('never stuck: the 5 s hard stop', () => {
  it('removes the overlay at 5 s even with a clip that crawls and a wipe that never started', () => {
    mark()
    render(<LogoIntro />)
    advance(2400)
    startClip()
    // The clock moves, so it is not a stall, but far too slowly to reach the lift.
    for (let t = 0; now < SPLASH_TIMING.hardStopMs - 1; t += 5) {
      setClipTime(t)
      advance(Math.min(SPLASH_TIMING.stallMs / 2, SPLASH_TIMING.hardStopMs - 1 - now))
    }
    expect(animations).toHaveLength(0)
    expect(root()).not.toBeNull()
    advance(1)
    expect(root()).toBeNull()
    expect(marker()).toBeUndefined()
    expect(html.style.overflow).toBe('')
  })

  it('ends a running wipe at 5 s too', () => {
    now = 4700
    mark()
    render(<LogoIntro />)
    advance(SPLASH_TIMING.fallbackWipeMs)
    expect(root()).toBeNull()
  })

  it('is done at once when the overlay mounts at or after 5 s', () => {
    now = SPLASH_TIMING.hardStopMs
    mark()
    render(<LogoIntro />)
    expect(root()).toBeNull()
    expect(marker()).toBeUndefined()
    expect(html.style.overflow).toBe('')
  })

  it('releases the marker at 5 s even when the overlay chunk never loads', () => {
    chunk.broken = true
    mark()
    render(<LogoIntro />)
    advance(SPLASH_TIMING.hardStopMs - 1)
    expect(marker()).toBe('pending')
    advance(1)
    expect(marker()).toBeUndefined()
  })

  it('drops a download nobody adopted by 5 s', () => {
    chunk.broken = true
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    advance(SPLASH_TIMING.hardStopMs)
    expect(video.hasAttribute('src')).toBe(false)
  })
})

describe('automation and LOGO_INTRO_FORCE', () => {
  it('plays the clip under webdriver once the gate let the document through (forced build)', () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    mark()
    render(<LogoIntro />)
    expect(root()).not.toBeNull()
    expect(preloaded()).not.toBeNull()
    startClip()
    expect(attached()).not.toBeNull()
    expect(play).toHaveBeenCalledTimes(1)
  })
})

describe('what the splash no longer carries', () => {
  const overlay = read('../../src/components/brand/logo-intro-overlay.tsx')
  const takeover = read('../../src/components/brand/logo-intro.tsx')
  const gate = read('../../src/components/brand/intro-gate.ts')

  it('has no Lottie player, state observer or logo flight in the splash path', () => {
    for (const source of [overlay, takeover]) {
      expect(source).not.toMatch(/LottiePlayer|lottie-state|observeLottieState|flipTransform/)
      expect(source).not.toMatch(/INTRO_LOTTIE_SRC|INTRO_TARGET_ATTRIBUTE/)
    }
    expect(gate).not.toMatch(/flipTransform|INTRO_LOTTIE_SRC|INTRO_TARGET_ATTRIBUTE/)
  })

  it('keeps the shell free of any video: it cannot know the gate decision', () => {
    const server = read('../../src/components/brand/logo-intro-server.tsx')
    expect(server).not.toMatch(/<video|preload=/)
  })

  it('keeps the hero hook: the mascot runtime still waits for the marker to go', () => {
    const runtime = read('../../src/components/mascot/sino-runtime.ts')
    expect(runtime).toMatch(/dataset\.logoIntro !== 'pending'/)
  })
})
