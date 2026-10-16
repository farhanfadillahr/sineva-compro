import { describe, expect, it } from 'vitest'
import {
  buildServiceDetailMetadata,
  buildServicesListMetadata,
} from '@/components/pages/services/services-metadata'
import { publicFixtures } from '../fixtures/public'

const settings = publicFixtures.siteSettings
const page = publicFixtures.pages.servicesOverview
const service = publicFixtures.serviceDetails[0]!

describe('Services metadata', () => {
  it('list: title, description and canonical come from the page SEO fields', () => {
    const meta = buildServicesListMetadata(page, settings)
    expect(meta.title).toEqual({ absolute: page.seo.metaTitle })
    expect(meta.description).toBe(page.seo.metaDescription)
    expect(meta.alternates?.canonical).toBe('/services')
    expect(meta.openGraph).toMatchObject({ title: page.seo.metaTitle, url: '/services' })
  })

  it('detail: title, description and canonical come from the service SEO fields', () => {
    const meta = buildServiceDetailMetadata(service, settings)
    expect(meta.title).toEqual({ absolute: service.seo.metaTitle })
    expect(meta.description).toBe(service.seo.metaDescription)
    expect(meta.alternates?.canonical).toBe(`/services/${service.slug}`)
  })

  it('honours an editor canonical override', () => {
    const meta = buildServiceDetailMetadata(
      { ...service, seo: { ...service.seo, canonicalUrl: '/services/custom' } },
      settings,
    )
    expect(meta.alternates?.canonical).toBe('/services/custom')
  })

  it('adds a noindex robots rule only when the editor sets it', () => {
    expect(buildServiceDetailMetadata(service, settings).robots).toBeUndefined()
    expect(
      buildServiceDetailMetadata({ ...service, seo: { ...service.seo, noindex: true } }, settings)
        .robots,
    ).toEqual({ index: false, follow: false })
  })

  it('falls back to the default OG image of the site settings', () => {
    const meta = buildServiceDetailMetadata(service, settings)
    const images = (meta.openGraph as { images?: { url: string }[] }).images
    expect(images?.[0]?.url).toBe(settings.brand.defaultOgImage?.url)
  })

  it('works without site settings', () => {
    expect(buildServiceDetailMetadata(service, null).title).toEqual({
      absolute: service.seo.metaTitle,
    })
  })
})
