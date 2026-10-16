import { act, fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SinoLoop } from '../../src/components/motion/sino-loop'
import type { MediaAsset } from '../../src/features/content/types'
import {
  type MediaController,
  MockIntersectionObserver as IO,
  flush,
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
  setVisibility,
} from './motion-test-utils'

// Only L-wave is switched on: the real manifest has every loop at ready: false (the files are not
// delivered yet), and SinoLoop must be tested in both states. L-phone stays as shipped.
vi.mock('../../src/components/motion/sino-loops', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/components/motion/sino-loops')>()
  const loops = {
    ...original.SINO_LOOPS,
    'L-wave': { ...original.SINO_LOOPS['L-wave'], ready: true },
  }
  return {
    ...original,
    SINO_LOOPS: loops,
    isLoopReady: (id: keyof typeof loops) => loops[id].ready,
  }
})

const STILL: MediaAsset = {
  url: '/mascot/poses/sino-wave.webp',
  width: 1200,
  height: 1200,
  alt: '',
  blurDataUrl: null,
}

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const SAFARI_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'

let media: MediaController
let play: ReturnType<typeof vi.fn>
let pause: ReturnType<typeof vi.fn>

/** What the browser answers to `canPlayType` for the two probes pickLoopSource makes. */
function canPlay(types: { hevc: boolean; webm: boolean }) {
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation((type: string) => {
    if (type.includes('hvc1')) return types.hevc ? 'probably' : ''
    if (type.includes('vp9')) return types.webm ? 'probably' : ''
    return ''
  })
}

function setUserAgent(ua: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
}

function setSaveData(saveData: boolean) {
  Object.defineProperty(navigator, 'connection', { value: { saveData }, configurable: true })
}

beforeEach(() => {
  installIntersectionObserver()
  media = installMatchMedia(false)
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  // jsdom does not implement media playback; the calls are what the component is accountable for.
  play = vi.fn(() => Promise.resolve())
  pause = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  setUserAgent(CHROME_UA)
  canPlay({ hevc: false, webm: true })
  setVisibility('visible')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  removeMatchMedia()
  // @ts-expect-error remove the connection stub again
  delete navigator.connection
})

const mount = (props: Record<string, unknown> = {}) =>
  render(
    <article data-testid="host">
      <SinoLoop loop="L-wave" still={STILL} sizes="50vw" {...props} />
    </article>,
  )

const video = (container: HTMLElement) => container.querySelector('video')
const setInView = (el: Element, visible: boolean) =>
  act(() => IO.fire(el, { isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }))

describe('markup', () => {
  it('is a muted, looping, inline, preload-none, decorative video with a poster for first paint', () => {
    const { container } = mount()
    const el = video(container)!
    expect(el.muted).toBe(true)
    expect(el.loop).toBe(true)
    expect(el.hasAttribute('playsinline')).toBe(true)
    expect(el.getAttribute('preload')).toBe('none')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.getAttribute('poster')).toBe('/mascot/loops/sino-loop-wave.webp')
  })

  it('has no controls and takes no focus', () => {
    const el = video(mount().container)!
    expect(el.hasAttribute('controls')).toBe(false)
    expect(el.hasAttribute('autoplay')).toBe(false)
    expect(el.hasAttribute('tabindex')).toBe(false)
  })

  it('reserves its box with width, height and aspect-ratio so nothing shifts (CLS 0)', () => {
    const el = video(mount().container)!
    expect(el.getAttribute('width')).toBe('720')
    expect(el.getAttribute('height')).toBe('720')
    expect(el.style.aspectRatio).toBe('720 / 720')
  })

  it('renders the poster image on the server and first paint, with no video until the client decides', () => {
    const html = renderToString(
      createElement(SinoLoop, { loop: 'L-wave', still: STILL, sizes: '50vw' }),
    )
    expect(html).toContain('<img')
    expect(html).toContain('sino-loop-wave.webp')
    expect(html).not.toContain('<video')
  })
})

describe('source selection', () => {
  it('gives Chrome the webm', () => {
    expect(video(mount().container)!.getAttribute('src')).toBe('/mascot/loops/sino-loop-wave.webm')
  })

  it('gives Safari the HEVC alpha mov', () => {
    setUserAgent(SAFARI_UA)
    canPlay({ hevc: true, webm: true })
    expect(video(mount().container)!.getAttribute('src')).toBe('/mascot/loops/sino-loop-wave.mov')
  })

  it('does not give Chrome the mov even when it can decode HEVC (the alpha would be dropped)', () => {
    canPlay({ hevc: true, webm: true })
    expect(video(mount().container)!.getAttribute('src')).toMatch(/\.webm$/)
  })

  it('falls back to the poster image when no source is playable', () => {
    canPlay({ hevc: false, webm: false })
    const { container } = mount()
    expect(video(container)).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })
})

describe('playback', () => {
  it('plays only while intersecting', () => {
    const el = video(mount().container)!
    expect(play).not.toHaveBeenCalled()
    setInView(el, true)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('pauses when it scrolls out of view', () => {
    const el = video(mount().container)!
    setInView(el, true)
    setInView(el, false)
    expect(pause).toHaveBeenCalled()
  })

  it('pauses when the tab is hidden and resumes on return only if it is still in view', () => {
    const el = video(mount().container)!
    setInView(el, true)
    play.mockClear()
    pause.mockClear()

    act(() => setVisibility('hidden'))
    expect(pause).toHaveBeenCalledTimes(1)
    expect(play).not.toHaveBeenCalled()

    act(() => setVisibility('visible'))
    expect(play).toHaveBeenCalledTimes(1)

    // Scrolled away while the tab was hidden: coming back must not start an off-screen video.
    setInView(el, false)
    act(() => setVisibility('hidden'))
    play.mockClear()
    act(() => setVisibility('visible'))
    expect(play).not.toHaveBeenCalled()
  })

  it('does not play when it intersects while the tab is hidden', () => {
    const el = video(mount().container)!
    act(() => setVisibility('hidden'))
    setInView(el, true)
    expect(play).not.toHaveBeenCalled()
  })

  it('swallows a play() rejection (autoplay blocked, low power mode) and keeps the poster', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    play.mockImplementation(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')))
    const el = video(mount().container)!
    expect(() => setInView(el, true)).not.toThrow()
    await flush()
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    expect(video(document.body)).toBe(el)
  })

  it('survives a play() that throws synchronously or returns nothing (old engines)', () => {
    play.mockImplementation(() => {
      throw new Error('nope')
    })
    const el = video(mount().container)!
    expect(() => setInView(el, true)).not.toThrow()
    play.mockImplementation(() => undefined)
    expect(() => setInView(el, false)).not.toThrow()
    expect(() => setInView(el, true)).not.toThrow()
  })

  it('stops observing and listening on unmount', () => {
    const { unmount } = mount()
    const remove = vi.spyOn(document, 'removeEventListener')
    unmount()
    expect(IO.liveObserverCount()).toBe(0)
    expect(remove.mock.calls.some(([type]) => type === 'visibilitychange')).toBe(true)
    expect(pause).toHaveBeenCalled()
  })
})

describe('motion preferences', () => {
  it('shows only the poster under prefers-reduced-motion: no video element at all', () => {
    media.set(true)
    const { container } = mount()
    expect(video(container)).toBeNull()
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toContain(
      encodeURIComponent('/mascot/loops/sino-loop-wave.webp'),
    )
    expect(img.getAttribute('alt')).toBe('')
    expect(play).not.toHaveBeenCalled()
  })

  it('shows only the poster when the user asked to save data', () => {
    setSaveData(true)
    const { container } = mount()
    expect(video(container)).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('plays normally when Save-Data is off', () => {
    setSaveData(false)
    expect(video(mount().container)).not.toBeNull()
  })

  it('drops the video when reduced motion is switched on while the page is open', () => {
    const { container } = mount()
    expect(video(container)).not.toBeNull()
    act(() => media.set(true))
    expect(video(container)).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })
})

describe('not ready: the still pose stands in', () => {
  it('draws the given still and never a video while the loop files are not delivered', () => {
    const { container } = render(<SinoLoop loop="L-phone" still={STILL} sizes="50vw" />)
    expect(video(container)).toBeNull()
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toContain(encodeURIComponent(STILL.url))
    expect(play).not.toHaveBeenCalled()
  })

  it('renders nothing when it is not ready and there is no still either', () => {
    const { container } = render(<SinoLoop loop="L-phone" still={null} sizes="50vw" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('composes AnimatedPose', () => {
  it('sits in an AnimatedPose that reveals on scroll and lifts on hover, by passing its props on', () => {
    const { container, getByTestId } = mount({ index: 1, delayMs: 120 })
    const pose = container.querySelector<HTMLElement>('[data-animated-pose]')!
    expect(pose.contains(video(container))).toBe(true)
    expect(pose.style.getPropertyValue('--reveal-delay')).toBe('120ms')
    fireEvent.pointerEnter(getByTestId('host'), { pointerType: 'mouse' })
    expect(pose.getAttribute('data-active')).toBe('true')
  })

  it('keeps the same pose element when the video replaces the poster (reveal state survives)', () => {
    // Server render and hydration start from the poster; the video arrives after. If the wrapper
    // were remounted the reveal would restart.
    media.set(true)
    const { container } = mount()
    const before = container.querySelector('[data-animated-pose]')
    expect(video(container)).toBeNull()
    act(() => media.set(false))
    expect(video(container)).not.toBeNull()
    expect(container.querySelector('[data-animated-pose]')).toBe(before)
  })
})
