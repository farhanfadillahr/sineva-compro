import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// jsdom does not evaluate stylesheets, so the CSS-only motion rules (orbit rotation, chip float,
// bar slide, accordion height) are checked on the source: each one must have the documented
// timing and a reduced-motion override (motion.md section 9).
const SECTIONS_DIR = fileURLToPath(new URL('../../src/components/sections', import.meta.url))
const css = (name: string) => readFileSync(join(SECTIONS_DIR, name), 'utf8')

// The body of the first `@media (prefers-reduced-motion: reduce) { ... }` block.
function reducedMotionBlock(source: string): string {
  const start = source.indexOf('@media (prefers-reduced-motion: reduce)')
  expect(start, 'has a reduced motion block').toBeGreaterThan(-1)
  return source.slice(start)
}

describe('SinoStage CSS (mascot-sino.md section 4)', () => {
  const source = css('_internal/sino-stage.module.css')

  it('rotates the orbit arcs once per 60 s, linearly and forever', () => {
    expect(source).toMatch(/60s\s+linear\s+infinite/)
  })

  it('is still under reduced motion', () => {
    expect(reducedMotionBlock(source)).toMatch(/animation:\s*none/)
  })

  it('builds the glow from teal-100 at 70 percent and the shadow from teal-900 at 18 percent', () => {
    expect(source).toMatch(/var\(--teal-100\)\s+70%/)
    expect(source).toMatch(/var\(--teal-900\)\s+18%/)
  })
})

describe('ui-chip CSS (components.md section 10)', () => {
  const source = css('_internal/ui-chip.module.css')

  it('floats 6 px over 6 s and stops under reduced motion', () => {
    expect(source).toMatch(/6s/)
    expect(source).toMatch(/6px/)
    expect(reducedMotionBlock(source)).toMatch(/animation:\s*none/)
  })
})

describe('StickyCtaBar CSS (motion.md section 4.5)', () => {
  const source = css('sticky-cta-bar.module.css')

  it('slides over 400 ms with a power2.out style curve', () => {
    expect(source).toMatch(/400ms/)
    expect(source).toMatch(/cubic-bezier\(0\.215,\s*0\.61,\s*0\.355,\s*1\)/)
  })

  it('is instant under reduced motion', () => {
    expect(reducedMotionBlock(source)).toMatch(/transition:\s*none/)
  })
})

describe('FaqAccordion CSS (components.md section 7, motion.md section 6)', () => {
  const source = css('_internal/faq-accordion.module.css')

  it('opens the height in 360 ms with the default UI ease', () => {
    expect(source).toMatch(/var\(--dur-med\)/)
    expect(source).toMatch(/var\(--ease-out\)/)
  })

  it('rotates the plus to a cross (45 degrees)', () => {
    expect(source).toMatch(/rotate\(45deg\)/)
  })

  it('has no height animation under reduced motion', () => {
    expect(reducedMotionBlock(source)).toMatch(/transition:\s*none/)
  })

  it('shows every answer without JavaScript', () => {
    expect(source).toMatch(/@media \(scripting: none\)/)
  })
})

describe('StickySteps CSS (motion.md section 4.2)', () => {
  const source = css('_internal/sticky-steps-story.module.css')

  it('only collapses and dims inactive steps for scripted, motion-friendly desktop visitors', () => {
    expect(source).toMatch(/min-width:\s*1024px/)
    expect(source).toMatch(/prefers-reduced-motion:\s*no-preference/)
    expect(source).toMatch(/scripting:\s*enabled/)
  })

  it('dims inactive steps to 60 percent and grows the active title from 20 to 28 px', () => {
    expect(source).toMatch(/opacity:\s*0\.6/)
    expect(source).toMatch(/1\.75rem/)
    expect(source).toMatch(/1\.25rem/)
  })

  it('crossfades the screens in 450 ms', () => {
    expect(source).toMatch(/450ms/)
  })
})
