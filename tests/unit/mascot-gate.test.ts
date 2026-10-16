import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  evaluateSinoGate,
  readGateEnvironment,
  whenLoadedAndIdle,
  type GateEnvironment,
} from '@/components/mascot/sino-gate'

// Feature detection is mocked at two levels: `evaluateSinoGate` is a pure function over plain data
// (one test per rule), and `readGateEnvironment` turns a window-like object into that data.

const passing: GateEnvironment = {
  enabled: true,
  inViewport: true,
  webgl2: true,
  reducedMotion: false,
  saveData: false,
  deviceMemoryGb: 8,
}

describe('evaluateSinoGate', () => {
  it('passes when every condition holds', () => {
    expect(evaluateSinoGate(passing)).toEqual({ pass: true })
  })

  it.each([
    ['disabled', { enabled: false }],
    ['reduced-motion', { reducedMotion: true }],
    ['save-data', { saveData: true }],
    ['low-memory', { deviceMemoryGb: 2 }],
    ['out-of-view', { inViewport: false }],
    ['no-webgl2', { webgl2: false }],
  ] as const)('fails with reason %s', (reason, patch) => {
    expect(evaluateSinoGate({ ...passing, ...patch })).toEqual({ pass: false, reason })
  })

  it('accepts exactly 4 GB and rejects 3.9 GB of reported memory', () => {
    expect(evaluateSinoGate({ ...passing, deviceMemoryGb: 4 }).pass).toBe(true)
    expect(evaluateSinoGate({ ...passing, deviceMemoryGb: 3.9 }).pass).toBe(false)
  })

  it('does not penalise a browser that does not report memory (Safari, Firefox)', () => {
    expect(evaluateSinoGate({ ...passing, deviceMemoryGb: null }).pass).toBe(true)
  })

  it('reports the cheapest-to-fix reason first when several fail', () => {
    // The site setting wins over device checks so an admin switch-off is never reported as "slow device".
    expect(
      evaluateSinoGate({ ...passing, enabled: false, reducedMotion: true, webgl2: false }),
    ).toEqual({ pass: false, reason: 'disabled' })
    // Out of view is retryable, so it must not mask a permanent failure.
    expect(evaluateSinoGate({ ...passing, inViewport: false, webgl2: false })).toEqual({
      pass: false,
      reason: 'out-of-view',
    })
    expect(evaluateSinoGate({ ...passing, inViewport: false, reducedMotion: true })).toEqual({
      pass: false,
      reason: 'reduced-motion',
    })
  })
})

type FakeWindow = Parameters<typeof readGateEnvironment>[0]

function fakeWindow(
  options: {
    reduced?: boolean
    saveData?: boolean | undefined
    memory?: number | undefined
    webgl2?: boolean
    innerHeight?: number
  } = {},
) {
  const loseContext = vi.fn()
  const getContext = vi.fn((kind: string) =>
    kind === 'webgl2' && options.webgl2 !== false
      ? { getExtension: () => ({ loseContext }) }
      : null,
  )
  const win = {
    innerHeight: options.innerHeight ?? 800,
    matchMedia: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? (options.reduced ?? false) : false,
    }),
    navigator: {
      connection: options.saveData === undefined ? undefined : { saveData: options.saveData },
      deviceMemory: options.memory,
    },
    document: { createElement: () => ({ getContext }) },
  } as unknown as FakeWindow
  return { win, getContext, loseContext }
}

const hero = (rect: { top: number; bottom: number; height: number }) =>
  ({ getBoundingClientRect: () => rect }) as unknown as Element

describe('readGateEnvironment', () => {
  it('reads a capable desktop as passing', () => {
    const { win } = fakeWindow({ memory: 8, saveData: false })
    const env = readGateEnvironment(win, hero({ top: 100, bottom: 600, height: 500 }), true)
    expect(env).toEqual(passing)
  })

  it('reads reduced motion from the media query', () => {
    const { win } = fakeWindow({ reduced: true })
    expect(
      readGateEnvironment(win, hero({ top: 0, bottom: 500, height: 500 }), true),
    ).toMatchObject({
      reducedMotion: true,
    })
  })

  it('reads Save-Data from navigator.connection', () => {
    const { win } = fakeWindow({ saveData: true })
    expect(
      readGateEnvironment(win, hero({ top: 0, bottom: 500, height: 500 }), true),
    ).toMatchObject({
      saveData: true,
    })
  })

  it('treats a missing connection API as Save-Data off and a missing deviceMemory as unknown', () => {
    const { win } = fakeWindow({})
    expect(
      readGateEnvironment(win, hero({ top: 0, bottom: 500, height: 500 }), true),
    ).toMatchObject({
      saveData: false,
      deviceMemoryGb: null,
    })
  })

  it('reports WebGL2 missing when the context cannot be created, without trying webgl1', () => {
    const { win, getContext } = fakeWindow({ webgl2: false })
    expect(
      readGateEnvironment(win, hero({ top: 0, bottom: 500, height: 500 }), true),
    ).toMatchObject({
      webgl2: false,
    })
    expect(getContext).toHaveBeenCalledWith('webgl2')
    expect(getContext).not.toHaveBeenCalledWith('webgl')
  })

  it('releases the probe context so it does not count against the browser limit', () => {
    const { win, loseContext } = fakeWindow({})
    readGateEnvironment(win, hero({ top: 0, bottom: 500, height: 500 }), true)
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('does not probe WebGL at all once the site setting or reduced motion already decided', () => {
    const disabled = fakeWindow({})
    readGateEnvironment(disabled.win, hero({ top: 0, bottom: 500, height: 500 }), false)
    expect(disabled.getContext).not.toHaveBeenCalled()
    const reduced = fakeWindow({ reduced: true })
    readGateEnvironment(reduced.win, hero({ top: 0, bottom: 500, height: 500 }), true)
    expect(reduced.getContext).not.toHaveBeenCalled()
  })

  it.each([
    ['fully visible', { top: 100, bottom: 600, height: 500 }, true],
    ['partly visible', { top: 700, bottom: 1200, height: 500 }, true],
    ['below the fold', { top: 800, bottom: 1300, height: 500 }, false],
    ['scrolled past', { top: -600, bottom: -100, height: 500 }, false],
  ])('in viewport: %s', (_label, rect, expected) => {
    const { win } = fakeWindow({ innerHeight: 800 })
    expect(readGateEnvironment(win, hero(rect), true).inViewport).toBe(expected)
  })
})

describe('whenLoadedAndIdle (window load, then requestIdleCallback)', () => {
  let listeners: Record<string, () => void>
  let idle: ((cb: () => void, options?: { timeout: number }) => number) | undefined
  let idleCallbacks: Array<() => void>
  const cancelIdle = vi.fn()

  function win(readyState: 'loading' | 'complete', withIdle: boolean) {
    return {
      document: { readyState },
      addEventListener: (type: string, cb: () => void) => {
        listeners[type] = cb
      },
      removeEventListener: (type: string) => {
        delete listeners[type]
      },
      requestIdleCallback: withIdle ? idle : undefined,
      cancelIdleCallback: withIdle ? cancelIdle : undefined,
      setTimeout: (cb: () => void, ms: number) => setTimeout(cb, ms),
      clearTimeout: (id: number) => clearTimeout(id),
    } as unknown as FakeWindow
  }

  beforeEach(() => {
    vi.useFakeTimers()
    listeners = {}
    idleCallbacks = []
    idle = vi.fn((cb: () => void) => idleCallbacks.push(cb))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the load event, then for an idle slot, then runs the callback', () => {
    const run = vi.fn()
    whenLoadedAndIdle(win('loading', true), run)
    expect(run).not.toHaveBeenCalled()
    listeners.load!()
    expect(run).not.toHaveBeenCalled()
    idleCallbacks[0]!()
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('skips the load wait when the document is already complete', () => {
    const run = vi.fn()
    whenLoadedAndIdle(win('complete', true), run)
    expect(listeners.load).toBeUndefined()
    idleCallbacks[0]!()
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('asks for an idle slot with a timeout so a busy main thread cannot starve it forever', () => {
    whenLoadedAndIdle(win('complete', true), vi.fn())
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 2_000 })
  })

  it('falls back to a timer where requestIdleCallback does not exist (Safari)', () => {
    const run = vi.fn()
    whenLoadedAndIdle(win('complete', false), run)
    expect(run).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('cancel() before load removes the listener and never runs the callback', () => {
    const run = vi.fn()
    const cancel = whenLoadedAndIdle(win('loading', true), run)
    cancel()
    expect(listeners.load).toBeUndefined()
    expect(run).not.toHaveBeenCalled()
  })

  it('cancel() while waiting for idle cancels the idle request', () => {
    const run = vi.fn()
    const cancel = whenLoadedAndIdle(win('complete', true), run)
    cancel()
    expect(cancelIdle).toHaveBeenCalledTimes(1)
    idleCallbacks[0]!()
    expect(run).not.toHaveBeenCalled()
  })
})
