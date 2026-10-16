import type { MetadataRoute } from 'next'
import type { PublicContentSource } from '@/features/content/public'
import type { ContentLocale, PageKey } from '@/features/content/types'
import { localizeHref } from '@/i18n/href'
import { getPathname } from '@/i18n/navigation'

/** A page to list: a path (or an editor's canonical override), resolved against the site origin. */
export type SitemapPage = Readonly<{ path: string }>

export type SitemapContext = Readonly<{
  content: PublicContentSource
  locale: ContentLocale
}>

/** Produces the pages of one area of the site. Called once per enabled locale. */
export type SitemapSource = (context: SitemapContext) => Promise<readonly SitemapPage[]>

// Only pages that have real content and are meant to rank. Deliberately absent:
// - `thankYou` and `notFound`: noindex pages.
// - `workIndex`: still a placeholder shell, noindex until there is a project to show.
// - `blogIndex`: owned by the blog source, added through `extraSources`.
const INDEXABLE_PAGES = [
  ['home', '/'],
  ['servicesOverview', '/services'],
  ['product', '/products/ai-agents'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['privacy', '/privacy-policy'],
] as const satisfies readonly (readonly [PageKey, string])[]

const pagesSource: SitemapSource = async ({ content, locale }) => {
  const pages = await Promise.all(
    INDEXABLE_PAGES.map(async ([key, href]) => {
      const page = await content.getPage(key, locale)
      // A locale without this page has nothing to list. The editor's noindex flag wins over the
      // fact that the route exists: listing a noindex URL sends crawlers mixed signals.
      if (!page || page.seo.noindex) return null
      return { path: page.seo.canonicalUrl ?? getPathname({ locale, href }) }
    }),
  )
  return pages.filter((page) => page !== null)
}

const servicesSource: SitemapSource = async ({ content, locale }) => {
  const summaries = await content.listServices(locale)
  const services = await Promise.all(summaries.map(({ slug }) => content.getService(slug, locale)))
  return services
    .filter(
      (service): service is NonNullable<typeof service> => service !== null && !service.seo.noindex,
    )
    .map((service) => ({
      path:
        service.seo.canonicalUrl ??
        getPathname({
          locale,
          href: { pathname: '/services/[slug]', params: { slug: service.slug } },
        }),
    }))
}

/**
 * Every indexable public URL, absolute, one per enabled locale. Static pages first, then the
 * services, then whatever `extraSources` add (the blog will plug in there). A URL listed twice
 * is kept once.
 *
 * No `lastModified`, `changeFrequency` or `priority`: the static content carries no edit dates,
 * and an invented date is worse than none (Google ignores the other two).
 */
export async function collectSitemapEntries({
  content,
  siteUrl,
  locales,
  extraSources = [],
}: {
  content: PublicContentSource
  siteUrl: URL
  locales: readonly ContentLocale[]
  extraSources?: readonly SitemapSource[]
}): Promise<MetadataRoute.Sitemap> {
  const sources = [pagesSource, servicesSource, ...extraSources]
  const perLocale = await Promise.all(
    locales.map(async (locale) => {
      const perSource = await Promise.all(sources.map((source) => source({ content, locale })))
      return perSource.flat()
    }),
  )
  const urls = perLocale.flat().map(({ path }) => new URL(path, siteUrl).href)
  return [...new Set(urls)].map((url) => ({ url }))
}

/** All published article URLs, including later pages when the static source becomes a CMS. */
export const blogSitemapSource: SitemapSource = async ({ content, locale }) => {
  const index = await content.getPage('blogIndex', locale)
  if (!index || index.seo.noindex) return []
  const entries: SitemapPage[] = []
  let page = 1
  while (true) {
    const result = await content.listPosts({ locale, page, pageSize: 100 })
    for (const summary of result.posts) {
      const post = await content.getPost(summary.slug, locale)
      if (post && !post.seo.noindex) {
        entries.push({ path: post.seo.canonicalUrl ?? localizeHref(locale, `/blog/${post.slug}`) })
      }
    }
    if (result.posts.length === 0 || page * result.pageSize >= result.total) break
    page += 1
  }
  // An empty list (the Indonesian blog before its first article) is not worth crawling.
  if (entries.length === 0) return []
  return [{ path: index.seo.canonicalUrl ?? localizeHref(locale, '/blog') }, ...entries]
}
