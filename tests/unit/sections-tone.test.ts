import { describe, expect, it } from 'vitest'
import { assertSectionTones, checkSectionTones } from '@/components/sections/_internal/tone'
import { FINAL_CTA_TONE } from '@/components/sections/final-cta'

// docs/design/page-patterns.md section 4: adjacent sections never share the same non-white tone,
// and a page has at most one inverse section (the final CTA).
describe('section tone helper', () => {
  it('accepts the Home composition from page-patterns.md', () => {
    const home = [
      'aurora',
      'canvas',
      'tint',
      'canvas',
      'alt',
      'canvas',
      'canvas',
      'alt',
      'canvas',
      FINAL_CTA_TONE,
    ] as const
    expect(checkSectionTones(home)).toEqual([])
  })

  it('allows two white (canvas) sections in a row', () => {
    expect(checkSectionTones(['canvas', 'canvas'])).toEqual([])
  })

  it.each(['alt', 'tint', 'warm', 'aurora'] as const)(
    'rejects two adjacent %s sections',
    (tone) => {
      expect(checkSectionTones(['canvas', tone, tone])).toEqual([
        { code: 'adjacent-same-tone', index: 2, tone },
      ])
    },
  )

  it('rejects two inverse sections on one page, adjacent or not', () => {
    expect(checkSectionTones(['canvas', 'inverse', 'alt', 'inverse'])).toEqual([
      { code: 'multiple-inverse', index: 3, tone: 'inverse' },
    ])
  })

  it('reports an inverse pair once per rule they break', () => {
    const codes = checkSectionTones(['inverse', 'inverse']).map((v) => v.code)
    expect(codes).toEqual(['adjacent-same-tone', 'multiple-inverse'])
  })

  it('assertSectionTones throws a readable message and passes valid pages', () => {
    expect(() => assertSectionTones(['canvas', 'alt', 'canvas'])).not.toThrow()
    expect(() => assertSectionTones(['inverse', 'canvas', 'inverse'])).toThrow(
      /one inverse section/i,
    )
  })

  it('the final CTA block is the inverse section', () => {
    expect(FINAL_CTA_TONE).toBe('inverse')
  })
})
