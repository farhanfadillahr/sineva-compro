import type { Metadata } from 'next'
import type {
  SeoFields,
  ServiceDetail,
  ServicesOverviewPageContent,
  SiteSettingsDTO,
} from '@/features/content/types'
import { SERVICES_HREFS, serviceDetailHref } from './services-model'

/**
 * Metadata from the SEO fields of the content. The title is `absolute`: the content already
 * holds the full title ("... | Sineva") and the layout sets no title template, so a template
 * would print the brand twice. Robots stay with the layout (the whole site is noindex until
 * launch); the page only adds its own noindex when the editor sets it.
 */
function build(seo: SeoFields, path: string, settings: SiteSettingsDTO | null): Metadata {
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: seo.canonicalUrl ?? path },
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
      url: seo.canonicalUrl ?? path,
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}

export function buildServicesListMetadata(
  page: ServicesOverviewPageContent,
  settings: SiteSettingsDTO | null,
): Metadata {
  return build(page.seo, SERVICES_HREFS.services, settings)
}

export function buildServiceDetailMetadata(
  service: Pick<ServiceDetail, 'slug' | 'seo'>,
  settings: SiteSettingsDTO | null,
): Metadata {
  return build(service.seo, serviceDetailHref(service.slug), settings)
}
