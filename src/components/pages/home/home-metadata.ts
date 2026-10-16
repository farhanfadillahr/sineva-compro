import type { Metadata } from 'next'
import type { HomePageContent, SiteSettingsDTO } from '@/features/content/types'

/**
 * Metadata of `/` from the page SEO fields.
 *
 * The title is `absolute`: the content already holds the full title ("... | Sineva", at most 60
 * characters, see limits.ts), and the layout sets no title template, so a template applied here
 * would print the brand twice. Robots are left to the layout (the whole site stays noindex until
 * launch); the page only adds its own noindex when the editor sets it.
 */
export function buildHomeMetadata(
  page: HomePageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = page
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: seo.canonicalUrl ?? '/' },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    twitter: {
      card: 'summary_large_image',
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: ogImage ? [ogImage.url] : undefined,
    },
    openGraph: {
      type: 'website',
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: seo.canonicalUrl ?? '/',
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}
