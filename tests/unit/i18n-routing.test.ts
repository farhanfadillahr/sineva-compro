import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getPathname } from '../../src/i18n/navigation'
import { indonesianPathnames, routing } from '../../src/i18n/routing'

// The URL table in docs/design/page-patterns.md section 1 is the source of truth.
function sitemapRows(): { en: string; id: string }[] {
  const doc = readFileSync(new URL('../../docs/design/page-patterns.md', import.meta.url), 'utf8')
  const section = doc.slice(doc.indexOf('## 1. Sitemap'), doc.indexOf('## 2. Page compositions'))
  const rows: { en: string; id: string }[] = []
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim())
    const [en, id] = [cells[2], cells[3]].map((cell) => /^`([^`]+)`$/.exec(cell ?? '')?.[1])
    // Skips the header, separator, "(any)" 404 row and the unlocalised admin row.
    if (en?.startsWith('/') && id && en !== '/admin') rows.push({ en, id })
  }
  return rows
}

describe('English and Indonesian with as-needed prefix (CPR-101)', () => {
  it('enables en and id, en as the unprefixed default locale', () => {
    expect(routing.locales).toEqual(['en', 'id'])
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toBe('as-needed')
  })
  it('does no locale detection and sets no locale cookie', () => {
    expect(routing.localeDetection).toBe(false)
    expect(routing.localeCookie).toBe(false)
  })
  it('registers exactly the URL table of page-patterns.md section 1', () => {
    const rows = sitemapRows()
    expect(rows).toHaveLength(12)
    expect(Object.keys(routing.pathnames).sort()).toEqual(rows.map((row) => row.en).sort())
    for (const { en, id } of rows) {
      expect(routing.pathnames[en as keyof typeof routing.pathnames]).toEqual({
        en,
        // Stored without the `/id` prefix, which next-intl adds for non-default locales.
        id: id === '/id' ? '/' : id.replace(/^\/id/, ''),
      })
    }
  })
  it.each(
    sitemapRows()
      .map((row) => row.en)
      .filter((en) => !en.includes('[slug]')),
  )('builds %s without a locale prefix', (href) => {
    expect(getPathname({ locale: 'en', href: href as never })).toBe(href)
  })
  it.each([
    ['/services/[slug]', 'ai-build', '/services/ai-build'],
    ['/work/[slug]', 'ai-case', '/work/ai-case'],
    ['/blog/[slug]', 'ai-guide', '/blog/ai-guide'],
  ] as const)('builds dynamic %s without a prefix', (pathname, slug, want) => {
    expect(getPathname({ locale: 'en', href: { pathname, params: { slug } } })).toBe(want)
  })
  it('does not register the removed legacy or static service pages', () => {
    for (const gone of [
      '/portfolio',
      '/products/chatbot',
      '/services/web-development',
      '/services/ai-automation',
    ]) {
      expect(routing.pathnames).not.toHaveProperty(gone)
    }
  })
})

describe('Indonesian URLs', () => {
  it('lists one Indonesian URL per registered pathname', () => {
    expect(Object.keys(indonesianPathnames).sort()).toEqual(Object.keys(routing.pathnames).sort())
  })
  it('builds every page of the table under /id, and leaves English URLs unchanged', () => {
    for (const { en, id } of sitemapRows()) {
      const slugged = (path: string) => path.replace('[slug]', 'x')
      const href = (
        en.includes('[slug]') ? { pathname: en, params: { slug: 'x' } } : en
      ) as Parameters<typeof getPathname>[0]['href']
      expect(getPathname({ locale: 'en', href })).toBe(slugged(en))
      expect(getPathname({ locale: 'id', href })).toBe(slugged(id))
    }
  })
})
