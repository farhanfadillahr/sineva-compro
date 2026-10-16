import { afterEach, describe, expect, it, vi } from 'vitest'
import sitemap from '../../src/app/sitemap'
import { createStaticContentSource } from '../../src/content/static'
import { collectSitemapEntries, type SitemapSource } from '../../src/lib/sitemap'

const siteUrl = new URL('https://sinevaai.vercel.app')
const content = createStaticContentSource()
const urls = (entries: readonly { url: string }[]) => entries.map((entry) => entry.url)

describe('collectSitemapEntries', () => {
  it('lists every indexable public page with an absolute URL', async () => {
    const entries = await collectSitemapEntries({ content, siteUrl, locales: ['en'] })
    expect(urls(entries)).toEqual([
      'https://sinevaai.vercel.app/',
      'https://sinevaai.vercel.app/services',
      'https://sinevaai.vercel.app/products/ai-agents',
      'https://sinevaai.vercel.app/about',
      'https://sinevaai.vercel.app/contact',
      'https://sinevaai.vercel.app/privacy-policy',
      'https://sinevaai.vercel.app/services/ai-discovery',
      'https://sinevaai.vercel.app/services/ai-build',
      'https://sinevaai.vercel.app/services/ai-enablement',
    ])
  })

  it('leaves out thank-you, work, the 404 page, admin, api and dev-ui', async () => {
    const entries = await collectSitemapEntries({ content, siteUrl, locales: ['en'] })
    for (const url of urls(entries)) {
      expect(url).not.toMatch(/thank-you|\/work|not-found|\/admin|\/api|dev-ui/)
    }
  })

  it('skips a page the content marks noindex', async () => {
    const hidden: typeof content = {
      ...content,
      getPage: async (key, locale) => {
        const page = await content.getPage(key, locale)
        return page && key === 'about' ? { ...page, seo: { ...page.seo, noindex: true } } : page
      },
    }
    const entries = await collectSitemapEntries({ content: hidden, siteUrl, locales: ['en'] })
    expect(urls(entries)).not.toContain('https://sinevaai.vercel.app/about')
    expect(urls(entries)).toContain('https://sinevaai.vercel.app/contact')
  })

  it('skips a service the content marks noindex', async () => {
    const hidden: typeof content = {
      ...content,
      getService: async (slug, locale) => {
        const service = await content.getService(slug, locale)
        return service && slug === 'ai-build'
          ? { ...service, seo: { ...service.seo, noindex: true } }
          : service
      },
    }
    const entries = await collectSitemapEntries({ content: hidden, siteUrl, locales: ['en'] })
    expect(urls(entries)).not.toContain('https://sinevaai.vercel.app/services/ai-build')
    expect(urls(entries)).toContain('https://sinevaai.vercel.app/services/ai-discovery')
  })

  it('lists a locale only when it has content', async () => {
    // `id` is not enabled, so the static source answers with the empty contract for it.
    const entries = await collectSitemapEntries({
      content,
      siteUrl,
      locales: ['en', 'id' as never],
    })
    expect(entries).toHaveLength(9)
  })

  it('appends the entries of extra sources, such as the blog later', async () => {
    const blog: SitemapSource = async () => [{ path: '/blog' }, { path: '/blog/first-post' }]
    const entries = await collectSitemapEntries({
      content,
      siteUrl,
      locales: ['en'],
      extraSources: [blog],
    })
    expect(urls(entries).slice(-2)).toEqual([
      'https://sinevaai.vercel.app/blog',
      'https://sinevaai.vercel.app/blog/first-post',
    ])
  })

  it('never lists a URL twice', async () => {
    const again: SitemapSource = async () => [{ path: '/about' }]
    const entries = await collectSitemapEntries({
      content,
      siteUrl,
      locales: ['en'],
      extraSources: [again],
    })
    expect(new Set(urls(entries)).size).toBe(entries.length)
  })
})

describe('sitemap.xml route', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is served even when the site is not indexable, robots.txt does the blocking', async () => {
    vi.stubEnv('SITE_INDEXABLE', '')
    vi.stubEnv('SITE_URL', 'https://sinevaai.vercel.app')
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0]?.url).toBe('https://sinevaai.vercel.app/')
  })
})
