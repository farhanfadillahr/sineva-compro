import type { SiteSettingsDTO } from '@/features/content/types'

export function buildSiteJsonLd(siteUrl: URL, settings: SiteSettingsDTO | null) {
  const organizationId = new URL('/#organization', siteUrl).href
  const name = settings?.brand.siteName ?? 'Sineva'
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name,
        url: siteUrl.href,
        logo: new URL('/brand/icon-512.png', siteUrl).href,
        sameAs: Object.values(settings?.social ?? {}).filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': new URL('/#website', siteUrl).href,
        name,
        url: siteUrl.href,
        inLanguage: settings?.locale ?? 'en',
        publisher: { '@id': organizationId },
      },
    ],
  }
}
