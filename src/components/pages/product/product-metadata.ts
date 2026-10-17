import type { Metadata } from 'next'
import { renderTitle } from '@/lib/site-metadata'
import type { ProductPageContent, SiteSettingsDTO } from '@/features/content/types'
import { PRODUCT_HREFS } from './product-model'
import { languageAlternates, localizeHref } from '@/i18n/href'

/**
 * Metadata of `/products/ai-agents` from the page SEO fields.
 *
 * The title is the meta title inside the SEO title template (`renderTitle`), passed as `absolute`
 * and reused for Open Graph and Twitter so the tab, search result and social card match. Robots
 * are left to the layout (the whole site stays noindex until launch); the page only adds its own
 * noindex when the editor sets it.
 */
export function buildProductMetadata(
  page: ProductPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = page
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  const canonical = seo.canonicalUrl ?? localizeHref(page.locale, PRODUCT_HREFS.product)
  return {
    title: { absolute: renderTitle(seo.metaTitle, settings) },
    description: seo.metaDescription,
    alternates: { canonical, languages: languageAlternates(PRODUCT_HREFS.product) },
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
