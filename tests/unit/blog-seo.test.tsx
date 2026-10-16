import { describe, expect, it } from 'vitest'
import { buildBlogPostingJsonLd } from '@/components/pages/blog/blog-json-ld'
import { buildBlogListMetadata, buildBlogPostMetadata } from '@/components/pages/blog/blog-metadata'
import { buildBreadcrumbJsonLd } from '@/components/pages/services/services-json-ld'
import { serializeJsonLd } from '@/components/sections/_internal/faq'
import type { PostDetail } from '@/features/content/types'
import { staticContent } from '../../src/content/static'
import { publicFixtures } from '../fixtures/public'

const SITE = new URL('https://sineva.example')
const settings = publicFixtures.siteSettings
const page = publicFixtures.pages.blogIndex
// Has an uploaded cover, an author with a role and an update date.
const withMedia = publicFixtures.postDetails.find((post) => post.cover?.kind === 'media')!
// Cover kit and the team author: no image of its own.
const withKit = staticContent.postDetails[0] as PostDetail

describe('blog list metadata', () => {
  it('uses the SEO fields of the Blog page content as an absolute title', () => {
    const metadata = buildBlogListMetadata(page, settings, { category: null, page: 1 })
    expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
    expect(metadata.description).toBe(page.seo.metaDescription)
  })

  it('points the canonical of a filtered list at the main list', () => {
    const metadata = buildBlogListMetadata(page, settings, { category: 'ai-basics', page: 1 })
    expect(metadata.alternates?.canonical).toBe('/blog')
    expect(metadata.openGraph?.url).toBe('/blog')
  })

  it('points a filtered second page at the main list as well', () => {
    expect(
      buildBlogListMetadata(page, settings, { category: 'ai-basics', page: 2 }).alternates
        ?.canonical,
    ).toBe('/blog')
  })

  it('keeps the unfiltered list on /blog and makes a paginated page its own canonical', () => {
    expect(
      buildBlogListMetadata(page, settings, { category: null, page: 1 }).alternates?.canonical,
    ).toBe('/blog')
    expect(
      buildBlogListMetadata(page, settings, { category: null, page: 2 }).alternates?.canonical,
    ).toBe('/blog?page=2')
  })

  it('honours an editor canonical override on the unfiltered first page only', () => {
    const overridden = {
      ...page,
      seo: { ...page.seo, canonicalUrl: 'https://sineva.example/articles' },
    }
    expect(
      buildBlogListMetadata(overridden, settings, { category: null, page: 1 }).alternates
        ?.canonical,
    ).toBe('https://sineva.example/articles')
    expect(
      buildBlogListMetadata(overridden, settings, { category: 'ai-basics', page: 1 }).alternates
        ?.canonical,
    ).toBe('/blog')
  })

  it('adds noindex only when the editor sets it', () => {
    expect(
      buildBlogListMetadata(page, settings, { category: null, page: 1 }).robots,
    ).toBeUndefined()
    const hidden = { ...page, seo: { ...page.seo, noindex: true } }
    expect(buildBlogListMetadata(hidden, settings, { category: null, page: 1 }).robots).toEqual({
      index: false,
      follow: false,
    })
  })
})

describe('blog article metadata', () => {
  it('has the article canonical, an article Open Graph card and the dates', () => {
    const metadata = buildBlogPostMetadata(withMedia, settings)
    expect(metadata.title).toEqual({ absolute: withMedia.seo.metaTitle })
    expect(metadata.alternates?.canonical).toBe(`/blog/${withMedia.slug}`)
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      url: `/blog/${withMedia.slug}`,
      publishedTime: withMedia.publishedAt,
      modifiedTime: withMedia.updatedAt,
      authors: [withMedia.author!.name],
    })
  })

  it('shares the cover image when the article has one', () => {
    const metadata = buildBlogPostMetadata(withMedia, settings)
    const images = (metadata.openGraph as { images?: { url: string }[] }).images
    expect(images?.[0]?.url).toBe((withMedia.cover as { media: { url: string } }).media.url)
  })

  it('falls back to the site card for a cover kit', () => {
    const metadata = buildBlogPostMetadata(withKit, settings)
    const images = (metadata.openGraph as { images?: { url: string }[] }).images
    expect(images?.[0]?.url).toBe(settings.brand.defaultOgImage!.url)
  })
})

describe('BlogPosting JSON-LD', () => {
  it('has the BlogPosting shape with absolute urls and the article dates', () => {
    const data = buildBlogPostingJsonLd({ post: withMedia, settings, siteUrl: SITE })
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: withMedia.title,
      description: withMedia.seo.metaDescription,
      url: `https://sineva.example/blog/${withMedia.slug}`,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://sineva.example/blog/${withMedia.slug}`,
      },
      inLanguage: 'en',
      datePublished: withMedia.publishedAt,
      dateModified: withMedia.updatedAt,
      author: { '@type': 'Person', name: withMedia.author!.name },
      publisher: { '@type': 'Organization', name: settings.brand.siteName },
      articleSection: withMedia.category!.name,
    })
  })

  it('uses the cover as the image, then falls back to the Open Graph and site images', () => {
    const cover = buildBlogPostingJsonLd({ post: withMedia, settings, siteUrl: SITE })
    expect(cover.image).toEqual([(withMedia.cover as { media: { url: string } }).media.url])
    const kit = buildBlogPostingJsonLd({ post: withKit, settings, siteUrl: SITE })
    expect(kit.image).toEqual([new URL(settings.brand.defaultOgImage!.url, SITE).toString()])
  })

  it('makes root-relative image and logo urls absolute', () => {
    const relativeSettings = {
      ...settings,
      brand: {
        ...settings.brand,
        defaultOgImage: { ...settings.brand.defaultOgImage!, url: '/og/default-v006.png' },
        logo: { ...settings.brand.logo!, url: '/brand/logo.png' },
      },
    }
    const data = buildBlogPostingJsonLd({
      post: withKit,
      settings: relativeSettings,
      siteUrl: SITE,
    })
    expect(data.image).toEqual(['https://sineva.example/og/default-v006.png'])
    expect(data.publisher.logo).toEqual({
      '@type': 'ImageObject',
      url: 'https://sineva.example/brand/logo.png',
    })
  })

  it('uses the publish date as the modified date for an article never edited', () => {
    const data = buildBlogPostingJsonLd({ post: withKit, settings, siteUrl: SITE })
    expect(withKit.updatedAt).toBeNull()
    expect(data.dateModified).toBe(withKit.publishedAt)
  })

  it('names the publisher as the author when the article has none', () => {
    const anonymous = { ...withKit, author: null }
    const data = buildBlogPostingJsonLd({ post: anonymous, settings, siteUrl: SITE })
    expect(data.author).toEqual({ '@type': 'Organization', name: settings.brand.siteName })
  })

  it('omits what it does not know instead of inventing it', () => {
    const data = buildBlogPostingJsonLd({
      post: { ...withKit, category: null },
      settings: null,
      siteUrl: SITE,
    })
    expect(data).not.toHaveProperty('articleSection')
    expect(data).not.toHaveProperty('image')
    expect(data.publisher).toEqual({ '@type': 'Organization', name: 'Sineva' })
  })

  it('survives being put inside a script element', () => {
    const hostile = { ...withKit, title: '</script><script>alert(1)</script>' }
    const json = serializeJsonLd(buildBlogPostingJsonLd({ post: hostile, settings, siteUrl: SITE }))
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).headline).toBe(hostile.title)
  })
})

describe('article BreadcrumbList JSON-LD', () => {
  it('lists Home, Blog and the article with absolute urls', () => {
    const data = buildBreadcrumbJsonLd(
      [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: withKit.title, path: `/blog/${withKit.slug}` },
      ],
      SITE.origin,
    )
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement.map((item) => item.item)).toEqual([
      'https://sineva.example/',
      'https://sineva.example/blog',
      `https://sineva.example/blog/${withKit.slug}`,
    ])
    expect(data.itemListElement.map((item) => item.position)).toEqual([1, 2, 3])
  })
})
