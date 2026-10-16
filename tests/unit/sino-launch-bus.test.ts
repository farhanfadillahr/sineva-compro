import { describe, expect, it } from 'vitest'
import {
  createLaunchBus,
  isPlainLaunchClick,
  type LaunchEnvironment,
  type LaunchKind,
} from '@/components/mascot/sino-launch/launch-bus'
const allowed: LaunchEnvironment = {
  reduced: false,
  saveData: false,
  webdriver: false,
  hidden: false,
}
const originRect = { left: 10, top: 10, width: 100, height: 44 }
function setup(env = allowed, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const bus = createLaunchBus({ environment: () => env, storage })
  bus.subscribe(() => {})
  return {
    bus,
    request: (kind: LaunchKind, ready = true) => bus.requestLaunch({ kind, ready, originRect }),
  }
}
describe('Sino launch policy', () => {
  it('allows each type once and at most two per session', () => {
    const { request } = setup()
    expect(request('booking')).toBe(true)
    expect(request('booking')).toBe(false)
    expect(request('whatsapp')).toBe(true)
    expect(request('waitlist')).toBe(false)
  })
  it.each(['reduced', 'saveData', 'webdriver', 'hidden'] as const)('skips when %s', (key) => {
    expect(setup({ ...allowed, [key]: true }).request('booking')).toBe(false)
  })
  it('skips an unready asset without spending the session allowance', () => {
    const { request } = setup()
    expect(request('booking', false)).toBe(false)
    expect(request('booking')).toBe(true)
  })
  it('persists caps across layout remounts', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }
    expect(setup(allowed, storage).request('booking')).toBe(true)
    expect(setup(allowed, storage).request('booking')).toBe(false)
  })
  it.each([
    { button: 1 },
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
    { defaultPrevented: true },
  ])('skips modified clicks %j', (change) => {
    expect(
      isPlainLaunchClick({
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        ...change,
      }),
    ).toBe(false)
  })
})
