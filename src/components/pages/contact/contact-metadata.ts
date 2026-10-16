import type { Metadata } from 'next'
import type {
  ContactPageContent,
  SeoFields,
  SiteSettingsDTO,
  ThankYouPageContent,
} from '@/features/content/types'

const CONTACT_PATH = '/contact'
const THANK_YOU_PATH = '/contact/thank-you'

/**
 * The title is `absolute`: the content already holds the full title ("... | Sineva") and the
 * layout sets no title template, so a template here would print the brand twice.
 */
function metadataFor(
  seo: SeoFields,
  path: string,
  settings: SiteSettingsDTO | null,
  noindex: boolean,
): Metadata {
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: seo.canonicalUrl ?? path },
    // Robots are otherwise left to the layout (the whole site stays noindex until launch).
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
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
      url: seo.canonicalUrl ?? path,
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}

export function buildContactMetadata(
  page: ContactPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  return metadataFor(page.seo, CONTACT_PATH, settings, page.seo.noindex)
}

/**
 * The thank-you page is always noindex and nofollow, whatever the content flag says: it is a
 * confirmation screen with nothing to rank, and a search result pointing at it would send
 * visitors to a "thanks" page for a message they never wrote.
 */
export function buildThankYouMetadata(
  page: ThankYouPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  return metadataFor(page.seo, THANK_YOU_PATH, settings, true)
}
