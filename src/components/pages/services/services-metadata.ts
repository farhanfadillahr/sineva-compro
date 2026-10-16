import type { Metadata } from 'next'
import type {
  ContentLocale,
  SeoFields,
  ServiceDetail,
  ServicesOverviewPageContent,
  SiteSettingsDTO,
} from '@/features/content/types'
import { SERVICES_HREFS, serviceDetailHref } from './services-model'
import { languageAlternates, localizeHref } from '@/i18n/href'

/**
 * Metadata from the SEO fields of the content. The title is `absolute`: the content already
 * holds the full title ("... | Sineva") and the layout sets no title template, so a template
 * would print the brand twice. Robots stay with the layout (the whole site is noindex until
 * launch); the page only adds its own noindex when the editor sets it.
 */
function build(
  { seo, locale }: { seo: SeoFields; locale: ContentLocale },
  path: string,
  settings: SiteSettingsDTO | null,
): Metadata {
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  const canonical = seo.canonicalUrl ?? localizeHref(locale, path)
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical, languages: languageAlternates(path) },
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
      url: canonical,
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
  return build(page, SERVICES_HREFS.services, settings)
}

export function buildServiceDetailMetadata(
  service: Pick<ServiceDetail, 'slug' | 'seo' | 'locale'>,
  settings: SiteSettingsDTO | null,
): Metadata {
  return build(service, serviceDetailHref(service.slug), settings)
}
