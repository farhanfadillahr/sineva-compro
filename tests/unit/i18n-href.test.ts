import { describe, expect, it } from 'vitest'
import { buildBlogPostMetadata } from '../../src/components/pages/blog/blog-metadata'
import { buildHomeMetadata } from '../../src/components/pages/home/home-metadata'
import { buildServiceDetailMetadata } from '../../src/components/pages/services/services-metadata'
import { staticContent, staticContentId } from '../../src/content/static'
import { fillPathname, languageAlternates, localizeHref, parseAppHref } from '../../src/i18n/href'

describe('parseAppHref', () => {
  it('resolves static, dynamic, query and hash hrefs to their internal pathname', () => {
    expect(parseAppHref('/')).toEqual({ pathname: '/' })
    expect(parseAppHref('/contact/thank-you')).toEqual({ pathname: '/contact/thank-you' })
    expect(parseAppHref('/services/ai-build')).toEqual({
      pathname: '/services/[slug]',
      params: { slug: 'ai-build' },
    })
    expect(parseAppHref('/contact?service=ai-build')).toEqual({
      pathname: '/contact',
      query: { service: 'ai-build' },
    })
    expect(parseAppHref('/products/ai-agents#waitlist')).toEqual({
      pathname: '/products/ai-agents',
      hash: 'waitlist',
    })
  })

  it('leaves external, protocol-relative, anchor and unknown hrefs alone', () => {
    for (const href of ['https://wa.me/1', '//evil.example', '#faq', 'mailto:a@b.c', '/nope/x/y'])
      expect(parseAppHref(href)).toBeNull()
  })
})

describe('localizeHref', () => {
  it('keeps English URLs unchanged', () => {
    expect(localizeHref('en', '/services/ai-build')).toBe('/services/ai-build')
    expect(localizeHref('en', '/blog?page=2')).toBe('/blog?page=2')
  })

  it('builds the Indonesian URL with its prefix, query and hash', () => {
    expect(localizeHref('id', '/')).toBe('/id')
    expect(localizeHref('id', '/services/ai-build')).toBe('/id/layanan/ai-build')
    expect(localizeHref('id', '/contact?service=ai-build')).toBe('/id/kontak?service=ai-build')
    expect(localizeHref('id', '/products/ai-agents#waitlist')).toBe('/id/produk/ai-agents#waitlist')
    expect(localizeHref('id', 'https://wa.me/1')).toBe('https://wa.me/1')
  })
})

describe('fillPathname', () => {
  it('fills a template with the route params and keeps unknown ones visible', () => {
    expect(fillPathname('/services/[slug]', { locale: 'id', slug: 'ai-build' })).toBe(
      '/services/ai-build',
    )
    expect(fillPathname('/about', null)).toBe('/about')
    expect(fillPathname('/blog/[slug]', {})).toBe('/blog/[slug]')
  })
})

describe('Indonesian page metadata', () => {
  it('announces both languages of a page, English as x-default', () => {
    expect(languageAlternates('/services/ai-build')).toEqual({
      en: '/services/ai-build',
      id: '/id/layanan/ai-build',
      'x-default': '/services/ai-build',
    })
  })

  it('points an Indonesian page at its own URL, not the English one', () => {
    const service = staticContentId.serviceDetails.find((s) => s.slug === 'ai-build')!
    const metadata = buildServiceDetailMetadata(service, staticContentId.siteSettings)
    expect(metadata.alternates?.canonical).toBe('/id/layanan/ai-build')
    expect(metadata.openGraph?.url).toBe('/id/layanan/ai-build')
    const home = buildHomeMetadata(staticContentId.pages.home, staticContentId.siteSettings)
    expect(home.alternates?.canonical).toBe('/id')
  })

  it('gives an article no hreflang, since it is written in one language', () => {
    const post = staticContent.postDetails[0]
    expect(buildBlogPostMetadata(post, staticContent.siteSettings).alternates).toEqual({
      canonical: `/blog/${post.slug}`,
    })
  })
})
