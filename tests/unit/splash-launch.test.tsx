import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY } from './layout-test-utils'
import {
  prepareSplashLaunch,
  splashAllowed,
  SPLASH_LAUNCH_SOURCES,
  type SplashClipEvent,
} from '../../src/components/brand/splash-launch'

// The clip handle of the splash (docs/design/motion.md section 3.1): choosing the file, loading it
// early, playing it once, and reporting what it does. The sequence that uses it is in
// logo-intro.test.tsx.

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'

let now = 0
let created: HTMLVideoElement[]
let canWebm: boolean
let canHevc: boolean
let play: ReturnType<typeof vi.spyOn>
let load: ReturnType<typeof vi.spyOn>

const video = () => created.find((v) => v.getAttribute('src')) ?? null

function setUserAgent(userAgent: string) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
}
function setReadyState(el: HTMLVideoElement, value: number) {
  Object.defineProperty(el, 'readyState', { value, configurable: true })
}
function fire(el: HTMLVideoElement, type: string) {
  act(() => {
    el.dispatchEvent(new Event(type))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
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
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
  vi.restoreAllMocks()
  Reflect.deleteProperty(performance, 'mark')
})

describe('splashAllowed', () => {
  it('is true for a normal visitor', () => {
    expect(splashAllowed()).toBe(true)
  })

  it('is false under reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    expect(splashAllowed()).toBe(false)
  })

  it('is false under Save-Data', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true },
      configurable: true,
    })
    expect(splashAllowed()).toBe(false)
  })

  it('does not look at webdriver: the gate owns that rule, and a forced build must play the clip too', () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    expect(splashAllowed()).toBe(true)
  })
})

describe('prepareSplashLaunch: when it loads', () => {
  it('starts the download at once and keeps the element detached', () => {
    const clip = prepareSplashLaunch()
    expect(clip).not.toBeNull()
    expect(video()!.getAttribute('src')).toBe(SPLASH_LAUNCH_SOURCES.webm)
    expect(video()!.preload).toBe('auto')
    expect(load).toHaveBeenCalled()
    expect(document.contains(video())).toBe(false)
    expect(play).not.toHaveBeenCalled()
  })

  it('loads and plays under webdriver, so a LOGO_INTRO_FORCE build can be checked headlessly', () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    expect(prepareSplashLaunch()).not.toBeNull()
    expect(video()).not.toBeNull()
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
  ])('requests nothing under %s', (_name, arrange) => {
    arrange()
    expect(prepareSplashLaunch()).toBeNull()
    expect(created).toHaveLength(0)
  })

  it('has no lateness rule of its own: a slow page still gets the clip (the sequence decides)', () => {
    now = 1800
    expect(prepareSplashLaunch()).not.toBeNull()
  })
})

describe('prepareSplashLaunch: source selection by browser', () => {
  it.each([
    ['Chrome', CHROME_UA, SPLASH_LAUNCH_SOURCES.webm],
    ['Safari', SAFARI_UA, SPLASH_LAUNCH_SOURCES.mov],
  ])('%s gets the matching file', (_name, userAgent, src) => {
    setUserAgent(userAgent)
    prepareSplashLaunch()
    expect(video()!.getAttribute('src')).toBe(src)
  })

  it('gives Safari nothing when it cannot decode HEVC, not the unreliable WebM', () => {
    setUserAgent(SAFARI_UA)
    canHevc = false
    expect(prepareSplashLaunch()).toBeNull()
  })

  it('never lets Chrome take the HEVC file it cannot composite with alpha', () => {
    canWebm = false
    expect(prepareSplashLaunch()).toBeNull()
  })

  it('points at the files that ship', () => {
    expect(SPLASH_LAUNCH_SOURCES).toEqual({
      webm: '/mascot/launch/sino-launch.webm',
      mov: '/mascot/launch/sino-launch.mov',
    })
  })
})

describe('prepareSplashLaunch: element contract', () => {
  function started() {
    const clip = prepareSplashLaunch()!
    const slot = document.createElement('div')
    document.body.appendChild(slot)
    clip.start(slot)
    return { clip, slot, el: video()! }
  }

  it('is muted, inline, decorative and uncontrolled, and played from JavaScript', () => {
    const { el } = started()
    expect(el.muted).toBe(true)
    expect(el.hasAttribute('playsinline')).toBe(true)
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.getAttribute('tabindex')).toBe('-1')
    expect(el.hasAttribute('controls')).toBe(false)
    expect(el.hasAttribute('autoplay')).toBe(false)
    expect(el.hasAttribute('loop')).toBe(false)
    expect(el.disablePictureInPicture).toBe(true)
  })

  it('moves into the slot and plays exactly once, however often start is called', () => {
    const { clip, slot, el } = started()
    clip.start(slot)
    expect(slot.contains(el)).toBe(true)
    expect(play).toHaveBeenCalledTimes(1)
  })
})

describe('prepareSplashLaunch: state and events', () => {
  function events(clip: NonNullable<ReturnType<typeof prepareSplashLaunch>>) {
    const seen: SplashClipEvent[] = []
    clip.subscribe((event) => seen.push(event))
    return seen
  }

  it('is loading until the browser expects to play it through', () => {
    const clip = prepareSplashLaunch()!
    expect(clip.state()).toBe('loading')
    setReadyState(video()!, 3)
    expect(clip.state()).toBe('loading')
  })

  it('reports ready on canplaythrough, and stays ready for a late subscriber to read', () => {
    const clip = prepareSplashLaunch()!
    const seen = events(clip)
    setReadyState(video()!, 4)
    fire(video()!, 'canplaythrough')
    expect(seen).toEqual(['ready'])
    expect(clip.state()).toBe('ready')
  })

  it('reports playing at the first presented frame, then ended', () => {
    const clip = prepareSplashLaunch()!
    const seen = events(clip)
    clip.start(document.body)
    fire(video()!, 'playing')
    expect(clip.state()).toBe('playing')
    fire(video()!, 'ended')
    expect(clip.state()).toBe('ended')
    expect(seen).toEqual(['playing', 'ended'])
  })

  it('reports the clip clock in milliseconds', () => {
    const clip = prepareSplashLaunch()!
    Object.defineProperty(video()!, 'currentTime', { value: 0.46, configurable: true })
    expect(clip.currentTimeMs()).toBe(460)
  })

  it('reports failed on a load error, even before it started', () => {
    const clip = prepareSplashLaunch()!
    const seen = events(clip)
    fire(video()!, 'error')
    expect(seen).toEqual(['failed'])
    expect(clip.state()).toBe('failed')
  })

  it('reports failed when play() is refused (autoplay policy)', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
    const clip = prepareSplashLaunch()!
    const seen = events(clip)
    clip.start(document.body)
    await act(async () => {
      await Promise.resolve()
    })
    expect(seen).toEqual(['failed'])
  })

  it('stops notifying a listener that unsubscribed', () => {
    const clip = prepareSplashLaunch()!
    const listener = vi.fn()
    const stop = clip.subscribe(listener)
    stop()
    fire(video()!, 'error')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('prepareSplashLaunch: dispose', () => {
  it('stops the download, pauses and removes the element, and is safe twice', () => {
    const clip = prepareSplashLaunch()!
    const el = video()!
    const slot = document.createElement('div')
    document.body.appendChild(slot)
    clip.start(slot)
    load.mockClear()
    clip.dispose()
    clip.dispose()
    expect(el.hasAttribute('src')).toBe(false)
    expect(load).toHaveBeenCalledTimes(1)
    expect(document.contains(el)).toBe(false)
    expect(clip.state()).toBe('disposed')
  })

  it('ignores events from a disposed clip', () => {
    const clip = prepareSplashLaunch()!
    const el = video()!
    const listener = vi.fn()
    clip.subscribe(listener)
    clip.dispose()
    fire(el, 'canplaythrough')
    fire(el, 'error')
    expect(listener).not.toHaveBeenCalled()
  })

  it('does not start once disposed', () => {
    const clip = prepareSplashLaunch()!
    clip.dispose()
    const slot = document.createElement('div')
    clip.start(slot)
    expect(slot.children).toHaveLength(0)
    expect(play).not.toHaveBeenCalled()
  })

  it('is its own owner of last resort: an overlay that never mounts cannot leak the download past 5 s', () => {
    const clip = prepareSplashLaunch()!
    const el = video()!
    now = 4999
    vi.advanceTimersByTime(4999)
    expect(el.hasAttribute('src')).toBe(true)
    now = 5000
    vi.advanceTimersByTime(1)
    expect(el.hasAttribute('src')).toBe(false)
    expect(clip.state()).toBe('disposed')
  })
})

describe('prepareSplashLaunch: measurement marks', () => {
  it('marks ready and play, and marks skipped when it is dropped without playing', () => {
    const marks = vi.fn()
    Object.defineProperty(performance, 'mark', { value: marks, configurable: true })
    const clip = prepareSplashLaunch()!
    setReadyState(video()!, 4)
    fire(video()!, 'canplaythrough')
    expect(marks).toHaveBeenCalledWith('splash-launch:ready', expect.anything())
    clip.start(document.body)
    expect(marks).toHaveBeenCalledWith('splash-launch:play', expect.anything())
    clip.dispose()
    expect(marks).not.toHaveBeenCalledWith('splash-launch:skipped', expect.anything())

    marks.mockClear()
    created.length = 0
    prepareSplashLaunch()!.dispose()
    expect(marks).toHaveBeenCalledWith('splash-launch:skipped', expect.anything())
  })
})
