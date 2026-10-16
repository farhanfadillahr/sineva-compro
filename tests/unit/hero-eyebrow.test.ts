import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getContentSource } from '../../src/lib/content-source'

// Product owner decision (2026-10-16): hero sections carry no eyebrow label; it read as
// unprofessional above the headline. Section eyebrows further down the page are unaffected.
describe('hero eyebrows', () => {
  it.each(['home', 'product', 'servicesOverview'] as const)(
    '%s hero has no eyebrow',
    async (key) => {
      const page = (await getContentSource().getPage(key, 'en')) as { hero?: { eyebrow: unknown } }
      expect(page?.hero?.eyebrow ?? null).toBeNull()
    },
  )

  it('service detail hero passes no eyebrow', () => {
    const view = readFileSync('src/components/pages/services/service-detail-view.tsx', 'utf8')
    expect(view).not.toMatch(/eyebrow=\{labels\.detail\.eyebrow\}/)
  })
})
