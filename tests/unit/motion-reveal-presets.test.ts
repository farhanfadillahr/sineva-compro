import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { revealPresets, revealVariants } from '../../src/lib/motion/tokens'
import { revealSettleMs } from '../../src/lib/motion/use-reveal'

// jsdom does not evaluate stylesheets, so the preset numbers are checked on the source: the CSS
// must say what the tokens (and motion.md 4.1) say.
const css = readFileSync(join(process.cwd(), 'src/components/motion/Reveal.module.css'), 'utf8')
const doc = readFileSync(join(process.cwd(), 'docs/design/motion.md'), 'utf8')

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  expect(m, `rule ${selector}`).not.toBeNull()
  return m![1]!
}

describe('tokens', () => {
  it('lists the five documented presets', () => {
    expect([...revealVariants]).toEqual(['rise', 'lines', 'depth', 'clip', 'rise-scale'])
  })

  it('carries the numbers of the brief', () => {
    expect(revealPresets.lines).toMatchObject({ durationMs: 700, lineStepMs: 70, partDelayMs: 120 })
    expect(revealPresets.lines.partDistancePx).toBe(12)
    expect(revealPresets.depth).toMatchObject({
      durationMs: 800,
      stepMs: 60,
      distancePx: 40,
      scaleFrom: 0.96,
      rotateXDeg: 6,
    })
    expect(revealPresets.clip).toMatchObject({ durationMs: 900, insetPct: 18, scaleFrom: 1.06 })
    expect(revealPresets.riseScale).toMatchObject({ scaleFrom: 0.94, radiusFromPx: 48 })
  })
})

describe('Reveal.module.css presets', () => {
  it('lines: 700 ms per line, 70 ms line stagger, expo ease, mask from 100%', () => {
    const shown = rule('.lines.shown [data-split] [data-line-inner]')
    expect(shown).toMatch(/700ms var\(--ease-out-expo/)
    expect(shown).toMatch(/var\(--line, 0\) \* 70ms/)
    expect(rule('.lines.hidden [data-split] [data-line-inner]')).toMatch(/translateY\(100%\)/)
    expect(rule('.lines [data-split] [data-line]')).toMatch(/overflow:\s*clip/)
  })

  it('lines: eyebrow and lead follow 120 ms later with a fade and a 12 px rise', () => {
    const hidden = rule(".lines.hidden [data-reveal-part]:not([data-reveal-part='title'])")
    expect(hidden).toMatch(/opacity:\s*0/)
    expect(hidden).toMatch(/translateY\(12px\)/)
    const shown = css.match(/\.lines\.shown \[data-reveal-part\][^{]*\{[^}]*\}/)![0]
    expect(shown).toMatch(/\+ 120ms/)
  })

  it('depth: 40 px, scale .96, 6 degree tilt, 800 ms expo', () => {
    const hidden = rule('.depth.hidden')
    expect(hidden).toMatch(/translate3d\(0, 40px, 0\)/)
    expect(hidden).toMatch(/rotateX\(6deg\)/)
    expect(hidden).toMatch(/scale\(0\.96\)/)
    expect(hidden).toMatch(/perspective\(/)
    expect(rule('.depth.shown')).toMatch(/transform 800ms var\(--ease-out-expo/)
  })

  it('clip: inset 18% from the top edge to 0, 900 ms, inner image from 1.06', () => {
    expect(rule('.clip.hidden')).toMatch(/inset\(18% 0 0 0 round var\(--reveal-radius/)
    expect(rule('.clip.shown')).toMatch(/inset\(0 0 0 0 round/)
    expect(rule('.clip.shown')).toMatch(/clip-path 900ms var\(--ease-out-expo/)
    expect(rule('.clip.hidden :is(img, picture, video, [data-reveal-media])')).toMatch(
      /scale\(1\.06\)/,
    )
  })

  it('riseScale: from .94 and a 48 px clip, CSS fallback only', () => {
    const hidden = rule('.riseScale.hidden')
    expect(hidden).toMatch(/scale\(0\.94\)/)
    expect(hidden).toMatch(/inset\(0 round 48px\)/)
  })

  it('animates only opacity, transform and clip-path', () => {
    const transitions = [...css.matchAll(/transition(?:-property)?\s*:([^;]+);/g)].map((m) => m[1]!)
    expect(transitions.length).toBeGreaterThan(4)
    for (const t of transitions) {
      expect(t).not.toMatch(/\b(width|height|top|left|box-shadow|border-radius|filter|all)\b/)
    }
  })

  it('only hides content under a .hidden selector, never on a base or variant class', () => {
    const rules = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map((m) => ({
      selector: m[1]!.trim(),
      body: m[2]!,
    }))
    for (const r of rules.filter((x) => /opacity\s*:\s*0\s*;/.test(x.body))) {
      expect(r.selector).toMatch(/\.hidden\b/)
    }
  })

  it('has a reduced-motion rule that undoes every hidden and shown piece', () => {
    const block = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?\})\s*\}/.exec(css)![1]!
    for (const part of ['.hidden', '.shown', '[data-reveal-part]', '[data-line-inner]', 'img']) {
      expect(block).toContain(part)
    }
    expect(block).toMatch(/opacity:\s*1/)
    expect(block).toMatch(/transform:\s*none/)
    expect(block).toMatch(/clip-path:\s*none/)
    expect(block).toMatch(/transition:\s*none/)
  })

  it('puts will-change only on hidden and shown states', () => {
    const rules = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)]
    for (const [, selector, body] of rules) {
      if (/will-change\s*:\s*(?!auto)/.test(body!)) expect(selector).toMatch(/\.(hidden|shown)\b/)
    }
  })
})

describe('revealSettleMs', () => {
  it('waits for the longest piece of each preset plus its delay', () => {
    expect(revealSettleMs('rise', 0)).toBe(520 + 120)
    expect(revealSettleMs('depth', 120)).toBe(120 + 800 + 120)
    expect(revealSettleMs('clip', 0)).toBe(900 + 120)
    // 3 lines: the last starts 140 ms in and runs 700 ms.
    expect(revealSettleMs('lines', 0, 3)).toBe(700 + 140 + 120)
  })
})

describe('motion.md 4.1', () => {
  it('documents every preset', () => {
    const section = doc.slice(doc.indexOf('### 4.1'), doc.indexOf('### 4.2'))
    for (const name of revealVariants) expect(section).toContain(`\`${name}\``)
  })
})
