import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbJsonLd,
  buildServiceJsonLd,
} from '@/components/pages/services/services-json-ld'
import { serviceDetails } from '../../src/content/static/services'

const service = serviceDetails[1]!

describe('Service JSON-LD', () => {
  it('is a schema.org Service with name, description, provider and url', () => {
    const data = buildServiceJsonLd({
      service,
      providerName: 'Sineva',
      origin: 'https://sineva.example',
    })
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.summary,
      provider: { '@type': 'Organization', name: 'Sineva' },
      url: 'https://sineva.example/services/ai-build',
    })
  })

  it('falls back to a root-relative url when the site origin is unknown', () => {
    expect(buildServiceJsonLd({ service, providerName: 'Sineva', origin: null }).url).toBe(
      '/services/ai-build',
    )
  })

  it('leaves out the provider rather than inventing a name', () => {
    const data = buildServiceJsonLd({ service, providerName: null, origin: null })
    expect('provider' in data).toBe(false)
  })

  it('does not claim a price, rating, area or review', () => {
    const data = buildServiceJsonLd({ service, providerName: 'Sineva', origin: null })
    for (const key of ['offers', 'aggregateRating', 'review', 'areaServed', 'priceRange']) {
      expect(key in data).toBe(false)
    }
  })
})

describe('BreadcrumbList JSON-LD', () => {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'AI Build', path: '/services/ai-build' },
  ]

  it('numbers items from 1 in order and gives each a name and an absolute item url', () => {
    const data = buildBreadcrumbJsonLd(crumbs, 'https://sineva.example')
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('BreadcrumbList')
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sineva.example/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://sineva.example/services',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'AI Build',
        item: 'https://sineva.example/services/ai-build',
      },
    ])
  })

  it('does not double a trailing slash on the origin', () => {
    const data = buildBreadcrumbJsonLd(crumbs, 'https://sineva.example/')
    expect(data.itemListElement[1]!.item).toBe('https://sineva.example/services')
  })

  it('uses root-relative paths without an origin', () => {
    const data = buildBreadcrumbJsonLd(crumbs, null)
    expect(data.itemListElement.map((i) => i.item)).toEqual(crumbs.map((c) => c.path))
  })
})
