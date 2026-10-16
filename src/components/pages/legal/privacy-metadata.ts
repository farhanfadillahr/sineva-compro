import type { Metadata } from 'next'
import type { PrivacyPageContent, SiteSettingsDTO } from '@/features/content/types'

export const PRIVACY_PATH = '/privacy-policy'

/**
 * The title is `absolute`: the content already holds the full title ("... | Sineva") and the
 * layout sets no title template, so a template here would print the brand twice.
 */
export function buildPrivacyMetadata(
  page: PrivacyPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = page
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: seo.canonicalUrl ?? PRIVACY_PATH },
    // Robots are otherwise left to the layout (the whole site stays noindex until launch).
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
      url: seo.canonicalUrl ?? PRIVACY_PATH,
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}
