// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LottiePlayer, type LottiePlayerProps } from '../../src/components/motion/LottiePlayer'
import { subscribeToReducedMotion } from '../../src/lib/motion/reduced-motion'
import {
  type MediaController,
  MockIntersectionObserver as IO,
  flush,
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
  setVisibility,
} from './motion-test-utils'

type Listener = () => void

const h = vi.hoisted(() => {
  class FakeAnim {
    totalFrames = 60
    isLoaded = true
    listeners = new Map<string, Set<() => void>>()
    play = vi.fn()
    pause = vi.fn()
    destroy = vi.fn()
    goToAndStop = vi.fn()
    goToAndPlay = vi.fn()
    addEventListener = vi.fn((name: string, cb: () => void) => {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set())
      this.listeners.get(name)!.add(cb)
    })
    removeEventListener = vi.fn()
    emit(name: string) {
      for (const cb of [...(this.listeners.get(name) ?? [])]) cb()
    }
  }
  const state = {
    factoryRuns: 0,
    anims: [] as FakeAnim[],
    nextIsLoaded: true,
  }
  const loadAnimation = vi.fn((config: Record<string, unknown>) => {
    const anim = new FakeAnim()
    anim.isLoaded = state.nextIsLoaded
    state.anims.push(anim)
    void config
    return anim
  })
  return { FakeAnim, state, loadAnimation }
})

vi.mock('lottie-web/build/player/lottie_light', () => {
  h.state.factoryRuns++
  const lottie = { loadAnimation: h.loadAnimation }
  return { default: lottie }
})

const SRC = '/lottie/sineva-symbol-intro.json'
const DATA = { v: '5.7.0', fr: 60, ip: 0, op: 60, w: 100, h: 100, layers: [] }

let media: MediaController
let fetchMock: ReturnType<typeof vi.fn>

function mount(props: Partial<LottiePlayerProps> = {}) {
  const view = render(
    createElement(LottiePlayer, {
      src: SRC,
      width: 120,
      height: 120,
      ...props,
    } as LottiePlayerProps),
  )
  return { ...view, box: view.container.firstElementChild as HTMLElement }
}

const enter = (el: Element) =>
  act(() => IO.fire(el, { isIntersecting: true, intersectionRatio: 1 }))
const leave = (el: Element) =>
  act(() => IO.fire(el, { isIntersecting: false, intersectionRatio: 0 }))
const lastAnim = () => h.state.anims[h.state.anims.length - 1]

beforeEach(() => {
  installIntersectionObserver()
  media = installMatchMedia(false)
  h.state.anims = []
  h.state.nextIsLoaded = true
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => structuredClone(DATA) }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  setVisibility('visible')
  removeMatchMedia()
  vi.unstubAllGlobals()
})

describe('LottiePlayer: box and accessibility', () => {
  it('reserves its box from width and height before anything loads', () => {
    const { box } = mount({ width: 96, height: 48 })
    expect(box.style.width).toBe('96px')
    expect(box.style.height).toBe('48px')
  })

  it('reserves its box from an aspect ratio', () => {
    const { box } = mount({ width: undefined, height: undefined, aspectRatio: 16 / 9 })
    expect(box.style.aspectRatio).toBe(String(16 / 9))
  })

  it('is hidden from assistive tech by default', () => {
    const { box } = mount()
    expect(box.getAttribute('aria-hidden')).toBe('true')
    expect(box.getAttribute('role')).toBeNull()
  })

  it('becomes a labelled image when ariaLabel is given', () => {
    const { box } = mount({ ariaLabel: 'Sineva logo animation' })
    expect(box.getAttribute('role')).toBe('img')
    expect(box.getAttribute('aria-label')).toBe('Sineva logo animation')
    expect(box.getAttribute('aria-hidden')).toBeNull()
  })

  it('forwards className', () => {
    const { box } = mount({ className: 'logo' })
    expect(box.classList.contains('logo')).toBe(true)
  })
})

describe('LottiePlayer: lazy loading', () => {
  it('imports neither the player nor the JSON until the box is visible', async () => {
    mount()
    await flush()
    expect(h.state.factoryRuns).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(h.loadAnimation).not.toHaveBeenCalled()
  })

  it('does not load for a non-intersecting first callback', async () => {
    const { box } = mount()
    leave(box)
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads player and JSON when it first becomes visible, with the SVG renderer', async () => {
    const { box } = mount({ loop: true })
    enter(box)
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(SRC)
    expect(h.state.factoryRuns).toBe(1)
    expect(h.loadAnimation).toHaveBeenCalledTimes(1)
    const config = h.loadAnimation.mock.calls[0][0]
    expect(config).toMatchObject({
      container: box,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      animationData: DATA,
    })
    expect(lastAnim().play).toHaveBeenCalled()
  })

  it('defaults to a single play-through (no loop)', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    expect(h.loadAnimation.mock.calls[0][0]).toMatchObject({ loop: false })
  })

  it('loads only once however often it re-enters the viewport', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    leave(box)
    enter(box)
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(h.loadAnimation).toHaveBeenCalledTimes(1)
  })

  it('leaves the reserved box empty and does not throw when the JSON fails to load', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
    const { box } = mount()
    enter(box)
    await flush()
    expect(h.loadAnimation).not.toHaveBeenCalled()
    expect(box.dataset.lottieState).toBe('error')
  })

  it('survives a rejected fetch', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'))
    const { box } = mount()
    enter(box)
    await flush()
    expect(box.dataset.lottieState).toBe('error')
  })
})

describe('LottiePlayer: playback control', () => {
  it('pauses off-screen and resumes on re-entry', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    anim.pause.mockClear()
    anim.play.mockClear()
    leave(box)
    expect(anim.pause).toHaveBeenCalledTimes(1)
    enter(box)
    expect(anim.play).toHaveBeenCalledTimes(1)
  })

  it('does not start if the box left the viewport while the file was loading', async () => {
    const { box } = mount()
    enter(box)
    leave(box)
    await flush()
    expect(lastAnim().play).not.toHaveBeenCalled()
  })

  it('pauses when the tab is hidden and resumes when it returns', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    anim.pause.mockClear()
    anim.play.mockClear()
    act(() => setVisibility('hidden'))
    expect(anim.pause).toHaveBeenCalledTimes(1)
    act(() => setVisibility('visible'))
    expect(anim.play).toHaveBeenCalledTimes(1)
  })

  it('does not resume on tab return while off-screen', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    leave(box)
    act(() => setVisibility('hidden'))
    anim.play.mockClear()
    act(() => setVisibility('visible'))
    expect(anim.play).not.toHaveBeenCalled()
  })

  it('does not start playing in a hidden tab', async () => {
    act(() => setVisibility('hidden'))
    const { box } = mount()
    enter(box)
    await flush()
    expect(lastAnim().play).not.toHaveBeenCalled()
    act(() => setVisibility('visible'))
    expect(lastAnim().play).toHaveBeenCalled()
  })

  it('calls onComplete when the animation finishes', async () => {
    const onComplete = vi.fn()
    const { box } = mount({ onComplete })
    enter(box)
    await flush()
    act(() => lastAnim().emit('complete'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('playOnce (default): never replays after completing, even on re-entry', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    act(() => anim.emit('complete'))
    leave(box)
    anim.play.mockClear()
    enter(box)
    expect(anim.play).not.toHaveBeenCalled()
    expect(anim.goToAndPlay).not.toHaveBeenCalled()
  })

  it('playOnce={false}: replays from the first frame each time it re-enters after completing', async () => {
    const { box } = mount({ playOnce: false })
    enter(box)
    await flush()
    const anim = lastAnim()
    act(() => anim.emit('complete'))
    leave(box)
    enter(box)
    expect(anim.goToAndPlay).toHaveBeenCalledWith(0, true)
  })

  it('loop: keeps pausing off-screen and resuming, ignoring playOnce', async () => {
    const { box } = mount({ loop: true, playOnce: true })
    enter(box)
    await flush()
    const anim = lastAnim()
    anim.play.mockClear()
    leave(box)
    enter(box)
    expect(anim.pause).toHaveBeenCalled()
    expect(anim.play).toHaveBeenCalledTimes(1)
  })
})

describe('LottiePlayer: reduced motion', () => {
  beforeEach(() => {
    media = installMatchMedia(true)
  })

  it('shows the final frame statically and never plays', async () => {
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    expect(h.loadAnimation.mock.calls[0][0]).toMatchObject({ autoplay: false, loop: false })
    expect(anim.goToAndStop).toHaveBeenCalledWith(59, true)
    expect(anim.play).not.toHaveBeenCalled()
    act(() => setVisibility('hidden'))
    act(() => setVisibility('visible'))
    leave(box)
    enter(box)
    expect(anim.play).not.toHaveBeenCalled()
    expect(anim.goToAndPlay).not.toHaveBeenCalled()
  })

  it('does not loop even when asked to', async () => {
    const { box } = mount({ loop: true })
    enter(box)
    await flush()
    expect(h.loadAnimation.mock.calls[0][0]).toMatchObject({ loop: false })
  })

  it('waits for DOMLoaded before jumping to the final frame when the file is still parsing', async () => {
    h.state.nextIsLoaded = false
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    expect(anim.goToAndStop).not.toHaveBeenCalled()
    act(() => anim.emit('DOMLoaded'))
    expect(anim.goToAndStop).toHaveBeenCalledWith(59, true)
  })

  it('still loads lazily, only when visible', async () => {
    mount()
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('freezes on the final frame if the preference turns on while playing', async () => {
    media.set(false)
    const { box } = mount()
    enter(box)
    await flush()
    const anim = lastAnim()
    expect(anim.play).toHaveBeenCalled()
    act(() => media.set(true))
    expect(anim.pause).toHaveBeenCalled()
    expect(anim.goToAndStop).toHaveBeenCalledWith(59, true)
  })
})

describe('LottiePlayer: cleanup', () => {
  it('destroys the animation and disconnects its observer on unmount', async () => {
    const view = mount()
    enter(view.box)
    await flush()
    const anim = lastAnim()
    view.unmount()
    expect(anim.destroy).toHaveBeenCalledTimes(1)
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('stops listening for tab visibility after unmount', async () => {
    const view = mount()
    enter(view.box)
    await flush()
    const anim = lastAnim()
    view.unmount()
    anim.play.mockClear()
    anim.pause.mockClear()
    act(() => setVisibility('hidden'))
    expect(anim.pause).not.toHaveBeenCalled()
  })

  it('aborts the JSON request and never creates the animation if unmounted mid-load', async () => {
    let signal: AbortSignal | undefined
    fetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined
      await new Promise((r) => setTimeout(r, 5))
      return { ok: true, json: async () => DATA }
    })
    const view = mount()
    enter(view.box)
    view.unmount()
    await new Promise((r) => setTimeout(r, 20))
    expect(signal?.aborted).toBe(true)
    expect(h.loadAnimation).not.toHaveBeenCalled()
  })

  it('removes its reduced-motion listener on unmount', async () => {
    const view = mount()
    expect(media.listenerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(media.listenerCount()).toBe(0)
  })
})

describe('subscribeToReducedMotion', () => {
  it('notifies on change and stops after unsubscribe', () => {
    const cb: Listener = vi.fn()
    const off = subscribeToReducedMotion(cb)
    media.set(true)
    expect(cb).toHaveBeenCalledTimes(1)
    off()
    media.set(false)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('lottie-web import discipline', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n)
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(n) ? [p] : []
    })
  const sources = files(join(process.cwd(), 'src')).map((p) => ({
    path: p.replace(process.cwd() + '/', ''),
    text: readFileSync(p, 'utf8'),
  }))

  it('only ever references the light build, never the full player', () => {
    for (const { path, text } of sources) {
      const specifiers = [...text.matchAll(/['"](lottie-web[^'"]*)['"]/g)].map((m) => m[1])
      for (const s of specifiers) {
        expect(s, path).toBe('lottie-web/build/player/lottie_light')
      }
    }
    expect(sources.some((s) => s.text.includes('lottie-web/build/player/lottie_light'))).toBe(true)
  })

  it('reaches the player through a dynamic import only', () => {
    for (const { path, text } of sources) {
      expect(text, path).not.toMatch(/^import\s[^;]*from\s+['"]lottie-web/m)
    }
    const loader = sources.find((s) => s.path === 'src/lib/motion/lottie.ts')
    expect(loader?.text).toMatch(/import\(\s*['"]lottie-web\/build\/player\/lottie_light['"]\s*\)/)
  })
})
