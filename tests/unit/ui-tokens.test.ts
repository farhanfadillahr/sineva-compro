import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// docs/design/tokens.md and motion.md are the source of truth; globals.css must mirror them.
// These tests parse the markdown tables, so editing a value in only one of the two files fails.
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const css = read('src/app/globals.css')
const tokensMd = read('docs/design/tokens.md')
const motionMd = read('docs/design/motion.md')

const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

// First declaration of every custom property. A later redeclaration (for example the responsive
// `--gutter`) must not shadow the base value the doc table describes.
function declarations(source: string) {
  const map = new Map<string, string>()
  for (const match of stripComments(source).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi)) {
    if (!map.has(match[1])) map.set(match[1], match[2].trim())
  }
  return map
}
const decl = declarations(css)

// Whitespace-insensitive and case-insensitive, with `.5` and `0.5` treated alike, because
// Prettier rewrites hex case and number formatting in the CSS file but not in the markdown.
const norm = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(^|[^\d])\.(\d)/g, '$10.$2')

type Row = { token: string; cells: string[] }
function rows(markdown: string, tokenPattern: RegExp): Row[] {
  const out: Row[] = []
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
    const token = cells[0]?.match(/^`(--[a-z0-9-]+)`$/)?.[1]
    if (token && tokenPattern.test(token)) out.push({ token, cells })
  }
  return out
}
const firstCode = (cell: string) => cell.match(/`([^`]+)`/)?.[1] ?? cell

function expectToken(token: string, expected: string) {
  const actual = decl.get(token)
  expect(actual, `${token} is missing from globals.css`).toBeDefined()
  expect(norm(actual!), token).toBe(norm(expected))
}

function resolve(token: string): string {
  const value = decl.get(token)
  if (value === undefined) throw new Error(`${token} is not declared in globals.css`)
  const ref = value.match(/^var\((--[a-z0-9-]+)\)$/i)
  return ref ? resolve(ref[1]) : value
}

describe('token parity with docs/design/tokens.md', () => {
  const primitives = rows(tokensMd, /^--(teal|ink|white|aqua|mint|sun|red|green|amber)/)
  const semantic = rows(tokensMd, /^--color-/)

  it('finds the primitive and semantic tables', () => {
    expect(primitives.length).toBe(27)
    expect(semantic.length).toBe(21)
  })

  it.each(primitives.map((row) => [row.token, firstCode(row.cells[1])]))(
    'primitive %s is %s',
    (token, hex) => expectToken(token, hex),
  )

  it.each(semantic.map((row) => [row.token, firstCode(row.cells[1])]))(
    'semantic %s points at %s',
    (token, target) => expectToken(token, `var(${target})`),
  )

  it.each(rows(tokensMd, /^--gradient-/).map((row) => [row.token, firstCode(row.cells[1])]))(
    'gradient %s',
    (token, value) => expectToken(token, value),
  )

  it.each(rows(tokensMd, /^--radius-/).map((row) => [row.token, row.cells[1]]))(
    'radius %s is %s',
    (token, value) => expectToken(token, value.replace(/\s+px$/, 'px')),
  )

  it.each(rows(tokensMd, /^--shadow-/).map((row) => [row.token, firstCode(row.cells[1])]))(
    'shadow %s',
    (token, value) => expectToken(token, value),
  )

  it.each(
    rows(tokensMd, /^--(blur-nav|surface-nav|border-hairline)$/).map((row) => [
      row.token,
      firstCode(row.cells[1]),
    ]),
  )('surface effect %s', (token, value) => expectToken(token, value))

  it('declares a noise texture without a hardcoded external URL', () => {
    expect(decl.get('--noise')).toMatch(/^url\(/)
  })

  describe('typography scale', () => {
    const scale = rows(tokensMd, /^--text-/)
    it('finds all eleven scale steps', () => expect(scale.length).toBe(11))

    it.each(scale.map((row) => [row.token, firstCode(row.cells[1])]))(
      '%s size is %s',
      (token, size) => expectToken(token, size),
    )

    it.each(scale.map((row) => [row.token, row.cells[2], row.cells[3], row.cells[4]]))(
      '%s line-height, tracking and weight',
      (token, lineHeight, tracking, weight) => {
        expect(parseFloat(decl.get(`${token}--line-height`) ?? 'NaN'), 'line-height').toBe(
          parseFloat(lineHeight),
        )
        const trackingValue = tracking.split(',')[0].trim()
        expect(parseFloat(decl.get(`${token}--letter-spacing`) ?? 'NaN'), 'tracking').toBe(
          parseFloat(trackingValue),
        )
        expect(parseFloat(decl.get(`${token}--font-weight`) ?? 'NaN'), 'weight').toBe(
          parseFloat(weight),
        )
      },
    )
  })

  describe('spacing and layout', () => {
    const spaceTokens = [...tokensMd.matchAll(/`(--space-\d+)` \| (\d+) px/g)]
    it('finds all thirteen spacing steps', () => expect(spaceTokens.length).toBe(13))
    it.each(spaceTokens.map((m) => [m[1], `${m[2]}px`]))('%s is %s', (token, px) =>
      expectToken(token, px),
    )

    it('container, text column and section rhythm', () => {
      expectToken('--container-max', '1240px')
      expectToken('--container-max-wide', '1360px')
      expectToken('--container-text', '720px')
      expectToken('--section-y', 'clamp(4rem, 3rem + 5vw, 8rem)')
      expect(tokensMd).toContain('1240 px (content), 1360 px')
      expect(tokensMd).toContain('720 px')
    })

    it('uses the documented breakpoints', () => {
      expectToken('--breakpoint-sm', '40rem')
      expectToken('--breakpoint-md', '48rem')
      expectToken('--breakpoint-lg', '64rem')
      expectToken('--breakpoint-xl', '80rem')
      expectToken('--breakpoint-2xl', '90rem')
    })
  })

  it('has no dark theme', () => {
    const source = stripComments(css)
    expect(source).not.toMatch(/prefers-color-scheme/)
    expect(source).not.toMatch(/\.dark\b/)
    expect(source).not.toMatch(/data-theme/)
  })

  it('exposes semantic tokens beyond the doc only as aliases of primitives', () => {
    expectToken('--color-danger-surface', 'var(--red-50)')
    expectToken('--color-success-surface', 'var(--green-50)')
  })
})

describe('motion tokens from docs/design/motion.md', () => {
  const easing = rows(motionMd, /^--ease-/)
  const durations = rows(motionMd, /^--dur-/)

  it('finds the easing and duration tables', () => {
    expect(easing.map((row) => row.token)).toEqual([
      '--ease-out',
      '--ease-out-expo',
      '--ease-bounce',
      '--ease-in-out',
      '--ease-in',
      '--ease-wipe',
    ])
    expect(durations.map((row) => row.token)).toEqual([
      '--dur-instant',
      '--dur-fast',
      '--dur-base',
      '--dur-med',
      '--dur-slow',
      '--dur-scene',
    ])
  })

  it.each(easing.map((row) => [row.token, firstCode(row.cells[1])]))('%s is %s', (token, value) =>
    expectToken(token, value),
  )

  // --dur-scene is documented as a 800-1200 ms range, so it has no single value to compare.
  it.each(
    durations
      .filter((row) => row.token !== '--dur-scene')
      .map((row) => [row.token, row.cells[1].replace(/\s+ms$/, 'ms')]),
  )('%s is %s', (token, value) => expectToken(token, value))

  it('keeps the scene duration inside its documented range', () => {
    const ms = parseFloat(decl.get('--dur-scene') ?? 'NaN')
    expect(ms).toBeGreaterThanOrEqual(800)
    expect(ms).toBeLessThanOrEqual(1200)
  })
})

// WCAG 2.1 relative luminance and contrast ratio.
function channel(value: number) {
  const s = value / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminance(hex: string) {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) throw new Error(`not a 6 digit hex: ${hex}`)
  const n = parseInt(m[1], 16)
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}
function contrast(fg: string, bg: string) {
  const [a, b] = [luminance(resolve(fg)), luminance(resolve(bg))]
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// [foreground token, background token, ratio listed in tokens.md section 1.3]
const BRAND_ON: [string, number][] = [
  ['--white', 6.56],
  ['--ink-50', 6.14],
  ['--teal-50', 5.94],
]
const PAIRS: [string, string, number][] = [
  ['--color-text', '--color-canvas', 15.11],
  ['--color-text-secondary', '--color-canvas', 8.1],
  ['--color-text-tertiary', '--color-canvas', 5.28],
  ['--color-text-tertiary', '--color-canvas-alt', 4.95],
  ['--color-text-tertiary', '--color-surface-tint', 4.78],
  ['--color-text-inverse', '--color-surface-inverse', 15.11],
  ...BRAND_ON.map(([bg, ratio]): [string, string, number] => ['--color-text-brand', bg, ratio]),
  ...BRAND_ON.map(([bg, ratio]): [string, string, number] => ['--color-link', bg, ratio]),
  ['--color-text-inverse', '--color-action-primary', 6.56],
  ['--color-text-inverse', '--color-action-primary-hover', 8.96],
  ['--color-text-inverse', '--color-action-dark', 15.11],
  ['--color-border-input', '--color-canvas', 3.3],
  ['--color-border-input', '--color-canvas-alt', 3.09],
  ['--color-focus', '--color-canvas', 3.68],
  ['--color-danger', '--color-canvas', 6.57],
  ['--color-danger', '--red-50', 6.05],
  ['--color-success', '--color-canvas', 5.69],
  ['--color-success', '--green-50', 5.4],
]

describe('WCAG contrast of the pairs listed in tokens.md section 1.3', () => {
  it.each(PAIRS)('%s on %s is at least %s:1', (fg, bg, listed) => {
    const ratio = contrast(fg, bg)
    // The doc rounds to two decimals, so allow half a hundredth of rounding either way.
    expect(ratio).toBeGreaterThanOrEqual(listed - 0.005)
    expect(Math.abs(ratio - listed)).toBeLessThan(0.011)
  })

  it('covers every ratio the doc lists, and no other', () => {
    const listedByToken = new Map<string, number[]>()
    for (const row of rows(tokensMd, /^--color-/)) {
      const cell = row.cells[2] ?? ''
      const found = [...cell.matchAll(/(\d+\.\d+):1/g)].map((m) => parseFloat(m[1]))
      // "same" means the link row repeats the --color-text-brand ratios.
      if (cell === 'same') continue
      if (found.length) listedByToken.set(row.token, found)
    }
    const asserted = new Map<string, number[]>()
    for (const [fg, , ratio] of PAIRS) {
      // Pairs where the semantic token is the background (white text on a button) belong to the
      // button token's row in the doc, so key them by the background that carries the ratio.
      const key = fg === '--color-text-inverse' ? undefined : fg
      if (key) asserted.set(key, [...(asserted.get(key) ?? []), ratio])
    }
    for (const [token, ratios] of listedByToken) {
      if (token.startsWith('--color-action') || token === '--color-text-inverse') continue
      expect(asserted.get(token)?.sort(), token).toEqual([...ratios].sort())
    }
    // Button rows state the white-label ratio on their own background.
    expect(tokensMd).toContain('White text 6.56:1')
    expect(tokensMd).toContain('White text 8.96:1')
    expect(tokensMd).toContain('White text 15.11:1')
    expect(tokensMd).toContain('15.11:1 on `--ink-950`')
  })

  it('never lets brand teal 500 carry text: it fails 4.5:1 on white', () => {
    expect(contrast('--teal-500', '--white')).toBeLessThan(4.5)
    expect(contrast('--color-text-brand', '--white')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('--color-action-primary', '--white')).toBeGreaterThanOrEqual(4.5)
    expect(resolve('--color-text-brand')).not.toBe(resolve('--teal-500'))
    expect(resolve('--color-link')).not.toBe(resolve('--teal-500'))
  })
})
