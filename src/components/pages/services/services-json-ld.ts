import type { ServiceDetail } from '@/features/content/types'
import { serviceDetailHref } from './services-model'

export type BreadcrumbCrumb = Readonly<{ name: string; path: string }>

/**
 * `origin` is the public site origin (`https://example.com`). Without one the url stays
 * root-relative, which is better than a wrong host but weaker for crawlers: schema.org and
 * Google expect absolute urls, so the page passes the origin as soon as the site has one.
 */
function absolute(origin: string | null, path: string): string {
  return origin ? `${origin.replace(/\/+$/, '')}${path}` : path
}

export type ServiceJsonLd = Readonly<{
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  description: string
  provider?: Readonly<{ '@type': 'Organization'; name: string }>
  url: string
}>

/**
 * schema.org Service from the content only. Nothing is added that the page does not say: no
 * price, rating, review or service area (copywriting.md rule 2).
 */
export function buildServiceJsonLd({
  service,
  providerName,
  origin,
}: {
  service: Pick<ServiceDetail, 'slug' | 'title' | 'summary'>
  providerName: string | null
  origin: string | null
}): ServiceJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary,
    ...(providerName ? { provider: { '@type': 'Organization', name: providerName } } : {}),
    url: absolute(origin, serviceDetailHref(service.slug)),
  }
}

export type BreadcrumbJsonLd = Readonly<{
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: readonly Readonly<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>[]
}>

export function buildBreadcrumbJsonLd(
  crumbs: readonly BreadcrumbCrumb[],
  origin: string | null,
): BreadcrumbJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(origin, crumb.path),
    })),
  }
}
