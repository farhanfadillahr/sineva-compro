import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'
import { collectSitemapEntries, type SitemapSource } from '@/lib/sitemap'
import { getSiteUrl } from '@/lib/site-url'

// Extension point: the blog adds a source here (index plus one entry per published post) instead
// of editing the collector. Each source is called once per enabled locale.
const EXTRA_SITEMAP_SOURCES: readonly SitemapSource[] = []

// Served whether or not the site is indexable: `robots.txt` is what blocks crawlers before
// launch, and it does not advertise this file then. Generated at build, so a content change
// needs a new deployment, like the pages themselves.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return collectSitemapEntries({
    content: getContentSource(),
    siteUrl: getSiteUrl(),
    locales: routing.locales,
    extraSources: EXTRA_SITEMAP_SOURCES,
  })
}
