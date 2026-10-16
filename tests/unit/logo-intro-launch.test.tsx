import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY } from './layout-test-utils'

// The splash jetpack launch (docs/design/motion.md section 3.1): a pre-rendered one-shot that plays
// inside the first-visit logo intro overlay and nowhere else. The overlay is loaded with
// next/dynamic in the app; under test the loader resolves synchronously, like logo-intro.test.tsx.
vi.mock('next/dynamic', async () => {
  const { LogoIntroOverlay } = await import('../../src/components/brand/logo-intro-overlay')
  return { default: () => LogoIntroOverlay }
})
vi.mock('../../src/components/motion/LottiePlayer', async () => {
  const { createElement } = await import('react')
  return {
    LottiePlayer: () => createElement('div', { 'data-lottie-state': 'ready' }),
  }
})

import { LogoIntro } from '../../src/components/brand/logo-intro'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'

const html = document.documentElement
const mark = () => {
  html.dataset.logoIntro = 'pending'
}
const root = () => document.querySelector<HTMLElement>('[data-slot="logo-intro"]')
const slot = () => document.querySelector<HTMLElement>('[data-slot="logo-intro-launch"]')
const attached = () => slot()?.querySelector('video') ?? null

// The overlay's clock is performance.now() (navigation start), so tests say "the video was ready
// 600 ms into the page" by moving this value.
let now = 0
function advance(ms: number) {
  now += ms
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

let created: HTMLVideoElement[]
let canWebm: boolean
let canHevc: boolean
let play: ReturnType<typeof vi.spyOn>
let load: ReturnType<typeof vi.spyOn>
let target: HTMLElement

/** The preload element the takeover creates at mount, before the overlay chunk exists. */
const preloaded = () => created.find((video) => video.getAttribute('src')) ?? null

function becomeReady(video: HTMLVideoElement | null = preloaded()) {
  Object.defineProperty(video!, 'readyState', { value: 4, configurable: true })
  act(() => {
    video!.dispatchEvent(new Event('canplaythrough'))
  })
}

function setUserAgent(userAgent: string) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
}

beforeEach(() => {
  vi.useFakeTimers()
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  window.sessionStorage.clear()
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
  delete html.dataset.logoIntro
  canWebm = true
  canHevc = true
  setUserAgent(CHROME_UA)
  Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
  Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true })
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation((type) =>
    type.includes('webm')
      ? canWebm
        ? 'maybe'
        : ''
      : type.includes('hvc1') && canHevc
        ? 'maybe'
        : '',
  )
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
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
  target = realCreate('a')
  target.setAttribute('data-logo-intro-target', '')
  document.body.appendChild(target)
})

afterEach(() => {
  cleanup()
  target.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete html.dataset.logoIntro
  Reflect.deleteProperty(performance, 'mark')
})

describe('splash launch: plays only when the overlay plays', () => {
  it('creates no video and requests nothing when the gate did not mark the document', () => {
    render(<LogoIntro />)
    expect(created).toHaveLength(0)
    expect(load).not.toHaveBeenCalled()
    expect(root()).toBeNull()
  })

  it('never renders it under reduced motion, even if something marked the document', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    mark()
    render(<LogoIntro />)
    expect(created).toHaveLength(0)
    expect(attached()).toBeNull()
  })

  it('never renders it under webdriver, even in a build that forces the logo intro on', () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    mark()
    render(<LogoIntro />)
    expect(root()).not.toBeNull()
    expect(created).toHaveLength(0)
  })

  it('never renders it under Save-Data, but the logo intro itself still plays', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    })
    mark()
    render(<LogoIntro />)
    expect(root()).not.toBeNull()
    expect(created).toHaveLength(0)
  })

  it('fetches nothing when the page is too late for the intro to play at all', () => {
    now = 801
    mark()
    render(<LogoIntro />)
    expect(created).toHaveLength(0)
    expect(html.dataset.logoIntro).toBeUndefined()
  })

  it('starts the fetch when the takeover mounts, before the overlay needs it', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    expect(video.getAttribute('src')).toBe('/mascot/launch/sino-launch.webm')
    expect(video.preload).toBe('auto')
    expect(load).toHaveBeenCalled()
    // Not on screen, not playing: it is only loading.
    expect(attached()).toBeNull()
    expect(play).not.toHaveBeenCalled()
  })

  it('plays once it is ready, inside the overlay', () => {
    mark()
    render(<LogoIntro />)
    advance(300)
    becomeReady()
    expect(attached()).toBe(preloaded())
    expect(root()!.contains(attached())).toBe(true)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('plays at once when the file was already ready by the time the overlay mounted', () => {
    // A cached file: readyState is already HAVE_ENOUGH_DATA when the overlay mounts.
    vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
    mark()
    render(<LogoIntro />)
    expect(attached()).not.toBeNull()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('plays once under StrictMode, which runs effects twice in development', () => {
    mark()
    render(
      <StrictMode>
        <LogoIntro />
      </StrictMode>,
    )
    becomeReady(created.filter((video) => video.getAttribute('src')).at(-1)!)
    expect(document.querySelectorAll('video')).toHaveLength(1)
    expect(play).toHaveBeenCalledTimes(1)
  })
})

describe('splash launch: source selection by browser', () => {
  it.each([
    ['Chrome', CHROME_UA, '/mascot/launch/sino-launch.webm'],
    ['Safari', SAFARI_UA, '/mascot/launch/sino-launch.mov'],
  ])('%s gets the matching file', (_name, userAgent, src) => {
    setUserAgent(userAgent)
    mark()
    render(<LogoIntro />)
    expect(preloaded()!.getAttribute('src')).toBe(src)
  })

  it('gives Safari nothing when it cannot decode HEVC, not the unreliable WebM', () => {
    setUserAgent(SAFARI_UA)
    canHevc = false
    mark()
    render(<LogoIntro />)
    expect(preloaded()).toBeNull()
  })

  it('never lets Chrome take the HEVC file it cannot composite with alpha', () => {
    canWebm = false
    canHevc = true
    mark()
    render(<LogoIntro />)
    expect(preloaded()).toBeNull()
  })
})

describe('splash launch: element contract', () => {
  function playing() {
    mark()
    render(<LogoIntro />)
    becomeReady()
    return attached()!
  }

  it('is muted, inline, decorative and uncontrolled, and is played from JavaScript', () => {
    const video = playing()
    expect(video.muted).toBe(true)
    expect(video.hasAttribute('playsinline')).toBe(true)
    expect(video.getAttribute('aria-hidden')).toBe('true')
    expect(video.getAttribute('tabindex')).toBe('-1')
    expect(video.hasAttribute('controls')).toBe(false)
    expect(video.hasAttribute('autoplay')).toBe(false)
    expect(video.hasAttribute('loop')).toBe(false)
    expect(video.disablePictureInPicture).toBe(true)
  })

  it('lives in a decorative slot behind the logo stage and is never focusable', () => {
    playing()
    const stage = document.querySelector('[data-slot="logo-intro-stage"]')!
    expect(slot()!.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(root()!.querySelectorAll('a, button, input, select, textarea').length).toBe(0)
  })

  it('swallows a rejected play() (autoplay policy) and removes the video', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
    mark()
    render(<LogoIntro />)
    becomeReady()
    await act(async () => {
      await Promise.resolve()
    })
    expect(attached()).toBeNull()
    // The logo intro itself carries on.
    expect(root()).not.toBeNull()
  })

  it('removes the video when the file fails to load', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    act(() => {
      video.dispatchEvent(new Event('error'))
    })
    expect(attached()).toBeNull()
    expect(root()).not.toBeNull()
  })

  it('takes no space: the slot is out of flow with a fixed 40vh box (CSS)', () => {
    const css = read('../../src/components/brand/logo-intro.module.css')
    const rule = css.match(/\.launch\s*\{([^}]*)\}/)![1]
    expect(rule).toMatch(/position:\s*(absolute|fixed)/)
    expect(rule).toMatch(/height:\s*40(d|s|l)?vh/)
    expect(rule).toMatch(/aspect-ratio:\s*3\s*\/\s*4/)
    expect(rule).toMatch(/pointer-events:\s*none/)
  })

  it('has a CSS lock for reduced motion on top of the gate', () => {
    const css = read('../../src/components/brand/logo-intro.module.css')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.launch/)
  })
})

describe('splash launch: never waits for the network', () => {
  it('is too late when it only becomes ready at the 0.9 s deadline', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    advance(900)
    becomeReady(video)
    expect(attached()).toBeNull()
  })

  it('plays when ready just before the deadline', () => {
    mark()
    render(<LogoIntro />)
    advance(899)
    becomeReady()
    expect(attached()).not.toBeNull()
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('skips, and stops the download, when it is not ready by the deadline', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    advance(900)
    expect(attached()).toBeNull()
    expect(video.hasAttribute('src')).toBe(false)
    expect(load.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(play).not.toHaveBeenCalled()
  })

  it('never shows it late: a file that becomes ready after the deadline stays off screen', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    advance(1000)
    Object.defineProperty(video, 'readyState', { value: 4, configurable: true })
    act(() => {
      video.dispatchEvent(new Event('canplaythrough'))
    })
    expect(attached()).toBeNull()
    expect(play).not.toHaveBeenCalled()
  })

  it('does not hold the intro back: the logo still ends at the 1.6 s cap without the video', () => {
    mark()
    render(<LogoIntro />)
    advance(1599)
    expect(root()).not.toBeNull()
    advance(1)
    expect(root()).toBeNull()
    expect(html.dataset.logoIntro).toBeUndefined()
  })

  it('measures: marks the moment it was ready and the moment it was skipped', () => {
    // jsdom has no User Timing marks.
    const mark_ = vi.fn()
    Object.defineProperty(performance, 'mark', { value: mark_, configurable: true })
    mark()
    render(<LogoIntro />)
    advance(400)
    becomeReady()
    expect(mark_).toHaveBeenCalledWith('splash-launch:play', expect.anything())
    cleanup()
    mark_.mockClear()
    now = 0
    created.length = 0
    mark()
    render(<LogoIntro />)
    advance(900)
    expect(mark_).toHaveBeenCalledWith('splash-launch:skipped', expect.anything())
  })
})

describe('splash launch: ends with the overlay', () => {
  it('is removed, with its download released, at the 1.6 s cap', () => {
    mark()
    render(<LogoIntro />)
    advance(300)
    becomeReady()
    const video = attached()!
    advance(1299)
    expect(document.contains(video)).toBe(true)
    advance(1)
    expect(document.contains(video)).toBe(false)
    expect(video.hasAttribute('src')).toBe(false)
    expect(root()).toBeNull()
  })

  it.each([
    ['keydown', (el: Element) => fireEvent.keyDown(el, { key: 'Tab' })],
    ['wheel', (el: Element) => fireEvent.wheel(el, { deltaY: 40 })],
    ['touchstart', (el: Element) => fireEvent.touchStart(el)],
    ['pointerdown', (el: Element) => fireEvent.pointerDown(el)],
  ])('is removed at once when %s skips the intro', (_name, fire) => {
    mark()
    render(<LogoIntro />)
    advance(300)
    becomeReady()
    const video = attached()!
    act(() => {
      fire(document.body)
    })
    expect(document.contains(video)).toBe(false)
    expect(video.hasAttribute('src')).toBe(false)
    expect(html.dataset.logoIntro).toBeUndefined()
  })

  it('stops loading when the intro is skipped before the file is ready', () => {
    mark()
    render(<LogoIntro />)
    const video = preloaded()!
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' })
    })
    expect(video.hasAttribute('src')).toBe(false)
    becomeReady(video)
    expect(attached()).toBeNull()
  })

  it('is removed when the visitor turns reduced motion on mid-play', () => {
    const media = installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
    mark()
    render(<LogoIntro />)
    becomeReady()
    const video = attached()!
    act(() => media.set(REDUCED_MOTION_QUERY, true))
    expect(document.contains(video)).toBe(false)
  })

  it('is released when the takeover unmounts', () => {
    mark()
    const view = render(<LogoIntro />)
    const video = preloaded()!
    view.unmount()
    expect(video.hasAttribute('src')).toBe(false)
  })

  it('dissolves Sino while she climbs, timed from the first played frame, so the frame edge never cuts her', () => {
    const css = read('../../src/components/brand/logo-intro.module.css')
    expect(css).toMatch(/\.launch\[data-playing\][^{]*\{[^}]*animation:[^;]*launch-dissolve/)
    const frames = css.match(/@keyframes launch-dissolve\s*\{([\s\S]*?\n\})/)![1]
    expect(frames).toMatch(/to\s*\{[^}]*opacity:\s*0/)
    expect(frames).not.toMatch(/transform|top|left|width|height/)
    mark()
    render(<LogoIntro />)
    becomeReady()
    expect(slot()!.hasAttribute('data-playing')).toBe(false)
    act(() => {
      attached()!.dispatchEvent(new Event('playing'))
    })
    expect(slot()!.hasAttribute('data-playing')).toBe(true)
  })
})

describe('server markup stays plain', () => {
  it('keeps the shell free of any video: it cannot know the gate decision', () => {
    const server = read('../../src/components/brand/logo-intro-server.tsx')
    expect(server).not.toMatch(/<video|preload=/)
  })
})
