import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  LOOP_IDS,
  SINO_LOOPS,
  isLoopReady,
  loopPoster,
} from '../../src/components/motion/sino-loops'
import { pickLoopSource, type LoopEnv } from '../../src/components/motion/sino-loop-source'

const PUBLIC_DIR = join(process.cwd(), 'public')

const UA = {
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeIosWebKit:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1',
  // iPadOS in desktop mode reports a Mac Safari UA and tells itself apart by touch points.
  ipadDesktopMode:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  chromeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  edgeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
} as const

const env = (patch: Partial<LoopEnv>): LoopEnv => ({
  userAgent: UA.chromeWin,
  maxTouchPoints: 0,
  canPlayHevc: false,
  canPlayWebm: true,
  ...patch,
})

describe('pickLoopSource', () => {
  it('gives Safari on macOS the HEVC alpha mov', () => {
    expect(pickLoopSource(env({ userAgent: UA.safariMac, canPlayHevc: true }))).toBe('mov')
  })

  it('gives every iOS browser the mov: they all run on WebKit', () => {
    for (const userAgent of [UA.safariIphone, UA.chromeIosWebKit]) {
      expect(pickLoopSource(env({ userAgent, canPlayHevc: true }))).toBe('mov')
    }
  })

  it('recognises iPadOS in desktop mode by its touch points', () => {
    expect(
      pickLoopSource(env({ userAgent: UA.ipadDesktopMode, maxTouchPoints: 5, canPlayHevc: true })),
    ).toBe('mov')
  })

  it('gives Chrome the webm even when it claims it can play HEVC (it would drop the alpha)', () => {
    expect(pickLoopSource(env({ userAgent: UA.chromeMac, canPlayHevc: true }))).toBe('webm')
    expect(pickLoopSource(env({ userAgent: UA.chromeWin, canPlayHevc: true }))).toBe('webm')
    expect(pickLoopSource(env({ userAgent: UA.chromeAndroid, canPlayHevc: true }))).toBe('webm')
  })

  it('gives Edge and Firefox the webm', () => {
    expect(pickLoopSource(env({ userAgent: UA.edgeWin, canPlayHevc: true }))).toBe('webm')
    expect(pickLoopSource(env({ userAgent: UA.firefox }))).toBe('webm')
  })

  it('never hands Safari the webm: its WebM alpha is unreliable, so it gets the poster instead', () => {
    expect(pickLoopSource(env({ userAgent: UA.safariMac, canPlayHevc: false }))).toBeNull()
  })

  it('returns null when the browser cannot play WebM', () => {
    expect(pickLoopSource(env({ userAgent: UA.firefox, canPlayWebm: false }))).toBeNull()
  })

  it('does not mistake a real Mac (no touch) running Chrome for iPadOS', () => {
    expect(
      pickLoopSource(env({ userAgent: UA.chromeMac, maxTouchPoints: 0, canPlayHevc: true })),
    ).toBe('webm')
  })
})

describe('SINO_LOOPS manifest', () => {
  it('lists the five loops', () => {
    expect([...LOOP_IDS].sort()).toEqual(
      ['L-build', 'L-confused', 'L-phone', 'L-thumbs', 'L-wave'].sort(),
    )
    expect(Object.keys(SINO_LOOPS).sort()).toEqual([...LOOP_IDS].sort())
  })

  it.each(LOOP_IDS)('%s names its three files under /mascot/loops/ with a reserved box', (id) => {
    const loop = SINO_LOOPS[id]
    expect(loop.webm).toMatch(/^\/mascot\/loops\/[a-z-]+\.webm$/)
    expect(loop.mov).toMatch(/^\/mascot\/loops\/[a-z-]+\.mov$/)
    expect(loop.poster).toMatch(/^\/mascot\/loops\/[a-z-]+\.webp$/)
    expect(loop.width).toBeGreaterThan(0)
    expect(loop.height).toBeGreaterThan(0)
  })

  it('enables the five delivered loops', () => {
    for (const id of LOOP_IDS) expect(SINO_LOOPS[id].ready, id).toBe(true)
    for (const id of LOOP_IDS) expect(isLoopReady(id), id).toBe(true)
  })

  it('may only be ready when all three files are on disk (no broken video in production)', () => {
    for (const id of LOOP_IDS) {
      const loop = SINO_LOOPS[id]
      if (!loop.ready) continue
      for (const url of [loop.webm, loop.mov, loop.poster]) {
        expect(existsSync(join(PUBLIC_DIR, url)), url).toBe(true)
      }
    }
  })

  it('builds a decorative poster asset (empty alt) in the reserved box', () => {
    const poster = loopPoster('L-wave')
    expect(poster).toEqual({
      url: SINO_LOOPS['L-wave'].poster,
      width: SINO_LOOPS['L-wave'].width,
      height: SINO_LOOPS['L-wave'].height,
      alt: '',
      blurDataUrl: null,
    })
  })
})
