import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollRule } from '../../src/components/motion/ScrollRule'
import { SectionHeader } from '../../src/components/ui'

const css = readFileSync(join(process.cwd(), 'src/components/motion/ScrollRule.module.css'), 'utf8')

describe('SectionHeader reveal parts', () => {
  it('marks eyebrow, title, lead and action so the `lines` preset can find them', () => {
    const { container } = render(
      <SectionHeader
        eyebrow="Eyebrow"
        title="Title"
        lead="Lead"
        action={<button type="button">Go</button>}
      />,
    )
    const part = (name: string) => container.querySelector(`[data-reveal-part="${name}"]`)
    expect(part('eyebrow')?.textContent).toBe('Eyebrow')
    expect(part('title')?.tagName).toBe('H2')
    expect(part('title')?.textContent).toBe('Title')
    expect(part('lead')?.textContent).toBe('Lead')
    expect(part('action')?.textContent).toBe('Go')
  })

  it('draws the scroll rule only when asked', () => {
    const plain = render(<SectionHeader title="T" />)
    expect(plain.container.querySelector('[data-scroll-rule]')).toBeNull()
    plain.unmount()
    const ruled = render(<SectionHeader title="T" rule />)
    expect(ruled.container.querySelector('[data-scroll-rule]')).not.toBeNull()
  })
})

describe('ScrollRule', () => {
  it('is a decorative hairline that is fully drawn without any support or script', () => {
    const { container } = render(<ScrollRule />)
    const rule = container.querySelector('[data-scroll-rule]')!
    expect(rule.getAttribute('aria-hidden')).toBe('true')
    // The base rule carries no transform: the drawn-in state is the only one that exists
    // unless a browser supports scroll timelines.
    const base = /\.rule\s*\{([^}]*)\}/.exec(css)![1]!
    expect(base).not.toMatch(/transform\s*:\s*scaleX\(0\)/)
  })

  it('animates scaleX only, on a view timeline, behind @supports and no-preference motion', () => {
    expect(css).toMatch(/@supports \(animation-timeline: view\(\)\)/)
    expect(css).toMatch(/prefers-reduced-motion: no-preference/)
    expect(css).toMatch(/animation-timeline:\s*view\(\)/)
    expect(css).toMatch(/scaleX\(0\)/)
    expect(css).not.toMatch(/\b(width|height|left|top)\s*:[^;]*;\s*}\s*to\b/)
  })
})
