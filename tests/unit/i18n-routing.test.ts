import { readFileSync } from 'node:fs'
import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'
import { describe, expect, it } from 'vitest'
import { getPathname } from '../../src/i18n/navigation'
import { plannedIdPathnames, routing } from '../../src/i18n/routing'

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

describe('single English locale with as-needed prefix', () => {
  it('enables only en, as the default, with an unprefixed default locale', () => {
    expect(routing.locales).toEqual(['en'])
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localePrefix).toEqual({ mode: 'as-needed' })
  })
  it('does no locale detection and sets no locale cookie', () => {
    expect(routing.localeDetection).toBe(false)
    expect(routing.localeCookie).toBe(false)
  })
  it('registers exactly the URL table of page-patterns.md section 1', () => {
    const rows = sitemapRows()
    expect(rows).toHaveLength(12)
    expect(Object.keys(routing.pathnames).sort()).toEqual(rows.map((row) => row.en).sort())
    for (const { en } of rows) {
      expect(routing.pathnames[en as keyof typeof routing.pathnames]).toBe(en)
    }
  })
  it.each(sitemapRows().map((row) => row.en))('builds %s without a locale prefix', (href) => {
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

describe('i18n-ready registry', () => {
  it('documents the future id URLs of the table, one per registered pathname', () => {
    const rows = sitemapRows()
    expect(Object.keys(plannedIdPathnames).sort()).toEqual(rows.map((row) => row.en).sort())
    for (const { en, id } of rows) {
      expect(plannedIdPathnames[en as keyof typeof plannedIdPathnames]).toBe(id)
    }
  })
  it('adds id as a data-only change that leaves English URLs unchanged', () => {
    const pathnames = Object.fromEntries(
      Object.entries(routing.pathnames).map(([key, en]) => [
        key,
        { en, id: plannedIdPathnames[key as keyof typeof plannedIdPathnames] },
      ]),
    )
    // Only `locales` and `pathnames` differ from the production config.
    const fixture = defineRouting({ ...routing, locales: ['en', 'id'], pathnames } as never)
    expect(fixture.defaultLocale).toBe('en')
    expect(fixture.localePrefix).toEqual(routing.localePrefix)
    const nav = createNavigation(fixture as never) as unknown as {
      getPathname: (input: { locale: string; href: unknown }) => string
    }
    for (const { en, id } of sitemapRows()) {
      const slugged = (path: string) => path.replace('[slug]', 'x')
      const href = en.includes('[slug]') ? { pathname: en, params: { slug: 'x' } } : en
      expect(nav.getPathname({ locale: 'en', href })).toBe(slugged(en))
      expect(nav.getPathname({ locale: 'id', href })).toBe(
        id === '/id' ? '/id' : `/id${slugged(id)}`,
      )
    }
  })
})
