import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INTRO_LIVE_ATTRIBUTE, shouldPlayIntro } from '../../src/components/brand/intro-gate'
import { INTRO_GATE_SCRIPT } from '../../src/components/brand/intro-gate-script'
import { LogoIntroGateScript, LogoIntroShell } from '../../src/components/brand/logo-intro-server'
import { SPLASH_TIMING, wipeClipPath } from '../../src/components/brand/splash-sequence'
import { installMatchMedia, REDUCED_MOTION_QUERY, removeMatchMedia } from './layout-test-utils'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

function setWebdriver(value: boolean) {
  Object.defineProperty(navigator, 'webdriver', { value, configurable: true })
}

/**
 * Run the gate exactly as the browser does: a classic inline script that finds its settings on
 * its own element (`document.currentScript`). Indirect eval runs it in the jsdom global scope.
 */
function runGate(settings: { enabled: boolean; force: boolean }) {
  const tag = document.createElement('script')
  tag.dataset.enabled = settings.enabled ? '1' : '0'
  tag.dataset.force = settings.force ? '1' : '0'
  Object.defineProperty(document, 'currentScript', { value: tag, configurable: true })
  try {
    ;(0, eval)(INTRO_GATE_SCRIPT)
  } finally {
    Reflect.deleteProperty(document, 'currentScript')
  }
  return document.documentElement.dataset.logoIntro === 'pending'
}

beforeEach(() => {
  window.sessionStorage.clear()
  delete document.documentElement.dataset.logoIntro
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false })
  setWebdriver(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  delete document.documentElement.dataset.logoIntro
})

describe('intro gate script', () => {
  it('plays on a full page load and marks the document before first paint', () => {
    expect(runGate({ enabled: true, force: false })).toBe(true)
  })

  it('plays again on a reload: the splash shows on every full page load', () => {
    runGate({ enabled: true, force: false })
    delete document.documentElement.dataset.logoIntro
    expect(runGate({ enabled: true, force: false })).toBe(true)
  })

  it('does not touch sessionStorage, so a blocked storage can never hide the splash', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem')
    const set = vi.spyOn(Storage.prototype, 'setItem')
    expect(runGate({ enabled: true, force: false })).toBe(true)
    expect(get).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })

  // The script is hand-minified ES5 and cannot import intro-gate.ts, so this table is what keeps
  // the two in lockstep: every combination of the four inputs must give the same answer.
  describe('agrees with shouldPlayIntro for every input combination', () => {
    const bools = [false, true]
    const cases = bools.flatMap((enabled) =>
      bools.flatMap((reducedMotion) =>
        bools.flatMap((webdriver) =>
          bools.map((force) => ({ enabled, reducedMotion, webdriver, force })),
        ),
      ),
    )
    it.each(cases)(
      'enabled=$enabled reduced=$reducedMotion webdriver=$webdriver force=$force',
      (input) => {
        installMatchMedia({ [REDUCED_MOTION_QUERY]: input.reducedMotion })
        setWebdriver(input.webdriver)
        delete document.documentElement.dataset.logoIntro
        expect(runGate({ enabled: input.enabled, force: input.force })).toBe(shouldPlayIntro(input))
      },
    )
  })

  it('plays when matchMedia is missing, like prefersReducedMotion()', () => {
    removeMatchMedia()
    expect(runGate({ enabled: true, force: false })).toBe(true)
  })

  it('does nothing, and does not throw, when it cannot find its own element', () => {
    expect(() => (0, eval)(INTRO_GATE_SCRIPT)).not.toThrow()
    expect(document.documentElement.dataset.logoIntro).toBeUndefined()
  })

  it('stays under 600 bytes, since it blocks first paint', () => {
    expect(new TextEncoder().encode(INTRO_GATE_SCRIPT).length).toBeLessThan(600)
  })

  it('needs no network and no external references', () => {
    expect(INTRO_GATE_SCRIPT).not.toMatch(/fetch|XMLHttpRequest|import\(|src=/)
  })

  it('has a sha256 documented in motion.md for the CSP hash', () => {
    const hash = createHash('sha256').update(INTRO_GATE_SCRIPT).digest('base64')
    expect(read('../../docs/design/motion.md')).toContain(`sha256-${hash}`)
  })
})

describe('server-rendered gate and shell', () => {
  it('renders the gate as an inline script carrying its settings as data attributes', () => {
    const html = renderToStaticMarkup(<LogoIntroGateScript enabled force={false} />)
    expect(html).toContain('<script')
    expect(html).toContain('data-enabled="1"')
    expect(html).toContain('data-force="0"')
    expect(html).toContain(INTRO_GATE_SCRIPT)
    expect(html).not.toContain('src=')
  })

  it('passes the site toggle and the force flag through', () => {
    const off = renderToStaticMarkup(<LogoIntroGateScript enabled={false} force />)
    expect(off).toContain('data-enabled="0"')
    expect(off).toContain('data-force="1"')
  })

  it('keeps the script text identical whatever the settings, so one CSP hash covers every build', () => {
    const a = renderToStaticMarkup(<LogoIntroGateScript enabled force />)
    const b = renderToStaticMarkup(<LogoIntroGateScript enabled={false} force={false} />)
    expect(a.replace(/data-[a-z]+="[01]"/g, '')).toBe(b.replace(/data-[a-z]+="[01]"/g, ''))
  })

  it('renders the shell: aria-hidden, no focusable content, no image that could become the LCP', () => {
    const html = renderToStaticMarkup(<LogoIntroShell />)
    expect(html).toContain('data-slot="logo-intro-shell"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toMatch(/<(a|button|input|img|video)\b|tabindex/i)
  })

  it('mounts the gate in <head> and the shell before the page content in the public layout', () => {
    const layout = read('../../src/app/(public)/[locale]/layout.tsx')
    const head = layout.slice(layout.indexOf('<head'), layout.indexOf('</head>'))
    expect(head).toContain('<LogoIntroGateScript')
    expect(layout.indexOf('<LogoIntroShell')).toBeGreaterThan(layout.indexOf('<body'))
    expect(layout.indexOf('<LogoIntroShell')).toBeLessThan(layout.indexOf('<SkipLink'))
    // The script flips an attribute on <html> before React hydrates it.
    expect(layout).toMatch(/<html[\s\S]*?suppressHydrationWarning[\s\S]*?<head>/)
  })
})

describe('shell CSS', () => {
  const css = read('../../src/components/brand/logo-intro.module.css')

  it('shows the shell only while the document is marked pending', () => {
    expect(css).toMatch(/:global\(html\[data-logo-intro=['"]pending['"]\]\)\s+\.shell/)
  })

  it('is hidden and inert by default, so it can never show without the gate', () => {
    const base = css.match(/\.shell\s*\{([^}]*)\}/)![1]
    expect(base).toMatch(/opacity:\s*0/)
    expect(base).toMatch(/visibility:\s*hidden/)
    expect(base).toMatch(/pointer-events:\s*none/)
  })

  it('uses the canvas colour so the page underneath is fully covered', () => {
    expect(css).toMatch(/var\(--color-canvas/)
  })

  it('stops covering the page by 5 s with CSS alone, even if JS never runs: inert at 4.8 s, gone at 5 s', () => {
    const pending = css.match(/html\[data-logo-intro='pending'\]\)\s+\.shell\s*\{([^}]*)\}/)![1]
    expect(pending).toMatch(/shell-inert 0s linear 4800ms forwards/)
    expect(pending).toMatch(/shell-safety 200ms linear 4800ms forwards/)
    // 4800 ms delay + 200 ms fade = 5000 ms, the hard stop of SPLASH_TIMING
    expect(4800 + 200).toBe(SPLASH_TIMING.hardStopMs)
    expect(css).toMatch(/@keyframes shell-inert\s*\{[^}]*pointer-events:\s*none/s)
    expect(css).toMatch(/@keyframes shell-safety\s*\{[\s\S]*visibility:\s*hidden/)
  })

  it('no longer carries the old 1.2 s and 1.8 s timers', () => {
    expect(css).not.toMatch(/\b1200ms\b|\b1600ms\b/)
  })

  it('is hidden at once, and stays hidden, while the client overlay is the cover', () => {
    const live = css.match(
      /html\[data-logo-intro='pending'\]\[data-logo-intro-live\]\)\s+\.shell\s*\{([^}]*)\}/,
    )![1]
    expect(live).toMatch(/opacity:\s*0/)
    expect(live).toMatch(/visibility:\s*hidden/)
    expect(live).toMatch(/pointer-events:\s*none/)
    expect(live).toMatch(/animation:\s*none/)
    expect(live).toMatch(/transition:\s*none/)
  })

  it('names the live attribute the overlay sets', () => {
    expect(INTRO_LIVE_ATTRIBUTE).toBe('data-logo-intro-live')
  })
})

describe('overlay CSS', () => {
  const css = read('../../src/components/brand/logo-intro.module.css')
  const root = css.match(/\.root\s*\{([^}]*)\}/)![1]
  const launch = css.match(/\.launch\s*\{([^}]*)\}/)![1]

  it('is a full-screen layer above the shell, in the canvas colour', () => {
    expect(root).toMatch(/position:\s*fixed/)
    expect(root).toMatch(/inset:\s*0/)
    expect(root).toMatch(/z-index:\s*71/)
    expect(root).toMatch(/var\(--color-canvas/)
  })

  it('blocks input until it is gone', () => {
    expect(root).toMatch(/pointer-events:\s*auto/)
  })

  it('starts fully covering, with the very clip-path the sequence animates from', () => {
    expect(root).toContain(`clip-path: ${wipeClipPath(0)};`)
  })

  it('carries its own CSS stop at 5 s in case the script never gets to remove it', () => {
    expect(root).toMatch(/animation:\s*root-safety 0s linear 5000ms forwards/)
    expect(css).toMatch(
      /@keyframes root-safety\s*\{[^}]*visibility:\s*hidden[^}]*pointer-events:\s*none/s,
    )
    expect(5000).toBe(SPLASH_TIMING.hardStopMs)
  })

  it('centres Sino: a 3:4 box whose top is the top of the screen, out of flow', () => {
    expect(launch).toMatch(/position:\s*absolute/)
    expect(launch).toMatch(/top:\s*0/)
    expect(launch).toMatch(/height:\s*76svh/)
    expect(launch).toMatch(/aspect-ratio:\s*3\s*\/\s*4/)
    expect(launch).toMatch(/pointer-events:\s*none/)
  })

  it('sizes and places her from the measured silhouette: about 55svh tall, near the middle', () => {
    // Per-frame alpha bounding box of the standing pose (ffmpeg cropdetect, limit 0.03): the
    // silhouette spans y 204..924 of the 960 px frame.
    const top = 204 / 960
    const bottom = 924 / 960
    const boxHeightSvh = Number(launch.match(/height:\s*(\d+)svh/)![1])
    const heightSvh = (bottom - top) * boxHeightSvh
    const middleSvh = ((top + bottom) / 2) * boxHeightSvh
    expect(heightSvh).toBeGreaterThan(52)
    expect(heightSvh).toBeLessThan(60)
    // The box cannot move down: its top edge has to stay on the top of the screen, or she would be
    // cut along a line across the screen while flying out of it. That leaves her a little high.
    expect(Math.abs(middleSvh - 50)).toBeLessThan(7)
  })

  it('moves nothing but clip-path: no layout properties and no dissolve', () => {
    expect(css).not.toMatch(/launch-dissolve/)
    const keyframes = [...css.matchAll(/@keyframes\s+[\w-]+\s*\{[\s\S]*?\n\}/g)].map((m) => m[0])
    for (const frame of keyframes) {
      expect(frame).not.toMatch(/\b(width|height|top|left|right|bottom|margin|box-shadow)\s*:/)
    }
  })

  it('has a CSS lock for reduced motion on top of the gate', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.root/)
  })

  it('has no Lottie stage', () => {
    expect(css).not.toMatch(/\.stage\b/)
  })
})
