import { act, render, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SinoHero } from '@/components/mascot/sino-hero'
import { HeroSplit } from '@/components/sections/hero-split'
import { image, REDUCED, stubMedia } from './sections-test-utils'
import { installIntersectionObserver, setViewportHeight } from './motion-test-utils'

// The runtime module is the lazy chunk (three.js). Replacing it lets the tests see whether the
// component ever asked for it: a factory that never ran means three.js was never fetched.
const runtime = vi.hoisted(() => ({
  factoryRuns: 0,
  start: vi.fn(),
  dispose: vi.fn(),
}))
vi.mock('@/components/mascot/sino-runtime', () => {
  runtime.factoryRuns += 1
  return { startSinoRuntime: runtime.start }
})

type StartOptions = {
  host: HTMLElement
  onFirstFrame: () => void
  onFallback: (reason: string) => void
}

let observers: ReturnType<typeof installIntersectionObserver>
let fetchSpy: ReturnType<typeof vi.fn>

function installWebgl2(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((kind: string) =>
    kind === 'webgl2' && available
      ? { getExtension: () => ({ loseContext: () => {} }) }
      : null) as unknown as HTMLCanvasElement['getContext'])
}

/** A stage with a poster `img`, the same shape HeroSplit renders, so the crossfade has a target. */
function Stage({ enabled = true }: { enabled?: boolean }) {
  return (
    <section data-testid="hero">
      <div data-slot="sino-stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- test stand-in for next/image */}
        <img src="/mascot/poster/sino-hero.webp" alt="" width={1600} height={1600} />
        <div data-slot="sino-canvas" aria-hidden="true">
          <SinoHero enabled={enabled} />
        </div>
      </div>
    </section>
  )
}

const poster = () => document.querySelector<HTMLImageElement>('[data-slot="sino-stage"] img')!
const host = () => document.querySelector<HTMLElement>('[data-slot="sino-hero-host"]')!

beforeEach(() => {
  runtime.factoryRuns = 0
  runtime.start.mockReset()
  runtime.dispose.mockReset()
  runtime.start.mockResolvedValue({ dispose: runtime.dispose })
  stubMedia({})
  observers = installIntersectionObserver()
  setViewportHeight(800)
  installWebgl2(true)
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
  // Run idle work at once; the load wait is covered by the gate tests.
  vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
    cb()
    return 1
  })
  vi.stubGlobal('cancelIdleCallback', () => {})
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    bottom: 600,
    height: 500,
    left: 0,
    right: 500,
    width: 500,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('SSR output', () => {
  it('renders the poster img with fixed dimensions and no canvas', () => {
    const html = renderToString(
      <HeroSplit
        variant="sino-canvas"
        headline="AI for your business"
        lead="Lead"
        primaryCta={{ label: 'Book', href: '/contact' }}
        image={image('Sino waving', 1600, 1600)}
        priority
        canvas={<SinoHero />}
      />,
    )
    expect(html).toContain('<img')
    expect(html).toMatch(/<img[^>]*width="1600"[^>]*height="1600"/)
    expect(html).not.toContain('<canvas')
    expect(html).toContain('data-slot="sino-canvas"')
    // The slot stays decorative.
    expect(html).toMatch(
      /data-slot="sino-canvas"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="sino-canvas"/,
    )
  })

  it('renders only an empty host that never takes focus', () => {
    const html = renderToString(<SinoHero />)
    expect(html).not.toContain('<canvas')
    expect(html).not.toMatch(/tabindex/i)
    expect(html).not.toMatch(/<(button|a|input)\b/)
  })
})

describe('gate outcomes', () => {
  it('starts the runtime once on a capable device and passes it the host element', async () => {
    render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalledTimes(1))
    const options = runtime.start.mock.calls[0]![0] as StartOptions
    expect(options.host).toBe(host())
  })

  it('under prefers-reduced-motion creates no canvas, requests no GLB and never loads the chunk', async () => {
    stubMedia({ [REDUCED]: true })
    render(<Stage />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(document.querySelector('canvas')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(runtime.start).not.toHaveBeenCalled()
    expect(runtime.factoryRuns).toBe(0)
  })

  it('renders only the poster when the site setting enableRealtimeSino is off', async () => {
    render(<Stage enabled={false} />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(runtime.start).not.toHaveBeenCalled()
    expect(runtime.factoryRuns).toBe(0)
    expect(document.querySelector('canvas')).toBeNull()
    expect(poster().style.opacity).toBe('')
  })

  it('keeps the poster without WebGL2', async () => {
    installWebgl2(false)
    render(<Stage />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(runtime.start).not.toHaveBeenCalled()
  })

  it('waits for the hero to enter the viewport when it starts below the fold, then starts', async () => {
    setViewportHeight(300)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 900,
      bottom: 1400,
      height: 500,
    } as DOMRect)
    render(<Stage />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(runtime.start).not.toHaveBeenCalled()
    await act(async () => {
      observers.fire(host(), { isIntersecting: true, intersectionRatio: 1 })
    })
    await waitFor(() => expect(runtime.start).toHaveBeenCalledTimes(1))
  })
})

describe('poster and canvas hand-over', () => {
  it('fades the poster out over 300 ms once the first frame is drawn', async () => {
    render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalled())
    expect(poster().style.opacity).toBe('')
    const options = runtime.start.mock.calls[0]![0] as StartOptions
    act(() => options.onFirstFrame())
    expect(poster().style.opacity).toBe('0')
    expect(poster().style.transition).toContain('300ms')
  })

  it('brings the poster back when the runtime falls back (slow device, lost context, GLB error)', async () => {
    render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalled())
    const options = runtime.start.mock.calls[0]![0] as StartOptions
    act(() => options.onFirstFrame())
    act(() => options.onFallback('context-lost'))
    expect(poster().style.opacity).toBe('1')
  })

  it('keeps the poster in place when starting the runtime rejects (GLB request fails)', async () => {
    runtime.start.mockRejectedValue(new Error('GLB 404'))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalled())
    await act(async () => {
      await Promise.resolve()
    })
    expect(poster().style.opacity === '' || poster().style.opacity === '1').toBe(true)
    expect(document.querySelector('canvas')).toBeNull()
    errors.mockRestore()
  })
})

describe('unmount', () => {
  it('disposes the runtime and restores the poster', async () => {
    const { unmount } = render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalled())
    const options = runtime.start.mock.calls[0]![0] as StartOptions
    act(() => options.onFirstFrame())
    const img = poster()
    unmount()
    expect(runtime.dispose).toHaveBeenCalledTimes(1)
    expect(img.style.opacity).toBe('1')
  })

  it('disposes a runtime that finishes loading after the component is already gone', async () => {
    let resolve!: (value: { dispose: () => void }) => void
    runtime.start.mockReturnValue(new Promise((r) => (resolve = r)))
    const { unmount } = render(<Stage />)
    await waitFor(() => expect(runtime.start).toHaveBeenCalled())
    unmount()
    await act(async () => {
      resolve({ dispose: runtime.dispose })
      await Promise.resolve()
    })
    expect(runtime.dispose).toHaveBeenCalledTimes(1)
  })

  it('removes its visibility observer when unmounted before the hero was ever visible', () => {
    setViewportHeight(300)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 900,
      bottom: 1400,
      height: 500,
    } as DOMRect)
    const { unmount } = render(<Stage />)
    unmount()
    expect(observers.liveObserverCount()).toBe(0)
  })

  it('does not start the runtime if unmounted before the idle slot arrives', () => {
    let idle: (() => void) | undefined
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
      idle = cb
      return 1
    })
    const { unmount } = render(<Stage />)
    unmount()
    idle?.()
    expect(runtime.start).not.toHaveBeenCalled()
  })
})
