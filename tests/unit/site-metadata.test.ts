import { describe, expect, it } from 'vitest'
import { staticContent } from '../../src/content/static'
import { applyTitleTemplate, buildRootMetadata, renderTitle } from '../../src/lib/site-metadata'

const settings = staticContent.siteSettings
const siteUrl = new URL('https://sinevaai.vercel.app')
const noindex = { index: false, follow: false }

describe('buildRootMetadata', () => {
  it('resolves every relative URL against the site origin', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(String(meta.metadataBase)).toBe('https://sinevaai.vercel.app/')
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
      images: [{ url: '/og/default-v008.png', width: 1200, height: 630 }],
    })
  })

  it('sets a large-image Twitter card with the same image', () => {
    const meta = buildRootMetadata({ settings, siteUrl, robots: noindex })
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['/og/default-v008.png'],
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
      images: [{ url: '/og/default-v008.png', width: 1200, height: 630 }],
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

// CPR-104: editors write the topic only; the brand comes from the SEO title template once.
describe('renderTitle', () => {
  it('applies the locale title template to a short meta title', () => {
    expect(renderTitle('Find your next step with AI', settings)).toBe(
      'Find your next step with AI | Sineva',
    )
  })

  it('follows a changed template', () => {
    const custom = { ...settings, seo: { ...settings.seo, titleTemplate: 'Sineva: {title}' } }
    expect(renderTitle('About', custom)).toBe('Sineva: About')
  })

  it('never prints the brand twice for a title that still carries it', () => {
    expect(renderTitle('Find your next step with AI | Sineva', settings)).toBe(
      'Find your next step with AI | Sineva',
    )
  })

  it('falls back to the default template without settings or with a broken template', () => {
    expect(renderTitle('About', null)).toBe('About | Sineva')
    const broken = { ...settings, seo: { ...settings.seo, titleTemplate: 'Sineva' } }
    expect(renderTitle('About', broken)).toBe('About | Sineva')
  })
})

// The admin snippet used to skip the template whenever the title contained the brand word, so
// "See how Sineva makes AI simple" previewed without the suffix the site adds.
describe('applyTitleTemplate', () => {
  it('wraps a topic that mentions the brand in the middle', () => {
    expect(applyTitleTemplate('See how Sineva makes AI simple', '{title} | Sineva')).toBe(
      'See how Sineva makes AI simple | Sineva',
    )
  })
})
