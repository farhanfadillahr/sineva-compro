import type { Metadata } from 'next'
import { renderTitle } from '@/lib/site-metadata'
import type { PrivacyPageContent, SiteSettingsDTO } from '@/features/content/types'
import { languageAlternates, localizeHref } from '@/i18n/href'

export const PRIVACY_PATH = '/privacy-policy'

/**
 * The title is the meta title inside the SEO title template (`renderTitle`), passed as `absolute`
 * and reused for Open Graph and Twitter so the tab, search result and social card match.
 */
export function buildPrivacyMetadata(
  page: PrivacyPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = page
  const canonical = seo.canonicalUrl ?? localizeHref(page.locale, PRIVACY_PATH)
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: renderTitle(seo.metaTitle, settings) },
    description: seo.metaDescription,
    alternates: { canonical, languages: languageAlternates(PRIVACY_PATH) },
    // Robots are otherwise left to the layout (the whole site stays noindex until launch).
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
