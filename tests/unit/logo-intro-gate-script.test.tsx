import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shouldPlayIntro } from '../../src/components/brand/intro-gate'
import { INTRO_GATE_SCRIPT } from '../../src/components/brand/intro-gate-script'
import { LogoIntroGateScript, LogoIntroShell } from '../../src/components/brand/logo-intro-server'
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

  it('turns inert after 1.2 s and fades out by 1.8 s with CSS alone, even if JS never runs', () => {
    expect(css).toMatch(/animation:[^;]*1200ms/)
    expect(css).toMatch(/animation:[^;]*1600ms/)
    expect(css).toMatch(/@keyframes[^{]+\{[^}]*pointer-events:\s*none/s)
    expect(css).toMatch(/@keyframes[^{]+\{[\s\S]*visibility:\s*hidden/)
  })

  it('never intercepts input from the client-side stage: only the shell does, and only until 1.2 s', () => {
    const stage = css.match(/\.stage\s*\{([^}]*)\}/)![1]
    expect(stage).toMatch(/pointer-events:\s*none/)
  })

  it('fades out over 200 ms when JavaScript removes the marker', () => {
    const base = css.match(/\.shell\s*\{([^}]*)\}/)![1]
    expect(base).toMatch(/transition:[^;]*opacity 200ms/)
  })
})
