import { describe, expect, it } from 'vitest'
import { staticContent } from '../../src/content/static'
import { buildRootMetadata } from '../../src/lib/site-metadata'

const settings = staticContent.siteSettings
const siteUrl = new URL('https://sinevaai.vercel.app')
const noindex = { index: false, follow: false }

describe('buildRootMetadata', () => {
  it('resolves every relative URL against the site origin', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.metadataBase?.href).toBe('https://sinevaai.vercel.app/')
  })

  it('uses the brand as the default title and a "%s | Sineva" template', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.title).toEqual({ default: 'Sineva', template: '%s | Sineva' })
  })

  it('takes the default description from the site settings', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.description).toBe(settings.seo.defaultDescription)
  })

  it('sets Open Graph defaults with the 1200x630 default image', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Sineva',
      locale: 'en_US',
      description: settings.seo.defaultDescription,
      images: [{ url: '/og/default.png', width: 1200, height: 630 }],
    })
  })

  it('sets a large-image Twitter card with the same image', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['/og/default.png'],
    })
  })

  it('passes the robots policy through unchanged', () => {
    expect(buildRootMetadata({ settings, siteUrl, robots: noindex }).robots).toEqual(noindex)
    const open = { index: true, follow: true }
    expect(buildRootMetadata({ settings, siteUrl, robots: open }).robots).toEqual(open)
  })

  it('falls back to the brand defaults when the locale has no settings', () => {
    const meta = buildRootMetadata({ settings: null, siteUrl, robots: noindex })
    expect(meta.title).toEqual({ default: 'Sineva', template: '%s | Sineva' })
    expect(meta.openGraph).toMatchObject({
      siteName: 'Sineva',
      images: [{ url: '/og/default.png', width: 1200, height: 630 }],
    })
    expect(typeof meta.description).toBe('string')
  })

  it('derives the template from the settings title template', () => {
    const custom = {
      ...settings,
      seo: { ...settings.seo, titleTemplate: '{title} | Sineva Studio' },
    }
    expect(buildRootMetadata({ settings: custom, siteUrl, robots: noindex }).title).toMatchObject({
      template: '%s | Sineva Studio',
    })
  })
})
