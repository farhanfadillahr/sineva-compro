import type { Metadata } from 'next'
import { renderTitle } from '@/lib/site-metadata'
import type { AboutPageContent, SiteSettingsDTO } from '@/features/content/types'
import { ABOUT_HREFS } from './about-model'
import { languageAlternates, localizeHref } from '@/i18n/href'

/**
 * Metadata of `/about` from the page SEO fields. The title is the meta title inside the SEO title
 * template (`renderTitle`), passed as `absolute` and reused for Open Graph and Twitter so the tab,
 * search result and social card match. Robots stay with the layout (the whole site is noindex
 * until launch); the page only adds its own noindex when the editor sets it.
 */
export function buildAboutMetadata(
  page: AboutPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = page
  const canonical = seo.canonicalUrl ?? localizeHref(page.locale, ABOUT_HREFS.about)
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: renderTitle(seo.metaTitle, settings) },
    description: seo.metaDescription,
    alternates: { canonical, languages: languageAlternates(ABOUT_HREFS.about) },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    twitter: {
      card: 'summary_large_image',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      images: ogImage ? [ogImage.url] : undefined,
    },
    openGraph: {
      type: 'website',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      url: canonical,
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}
