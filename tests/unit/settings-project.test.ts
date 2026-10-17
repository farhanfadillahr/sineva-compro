import { describe, expect, it } from 'vitest'
import { staticContent } from '../../src/content/static/source'
import { parseFields } from '../../src/features/cms/fields'
import {
  settingsGlobalSchema,
  settingsLocaleSchema,
  type SettingsGlobal,
  type SettingsLocale,
} from '../../src/features/settings/fields'
import {
  alignServiceTemplates,
  fillTemplate,
  projectSiteSettings,
  settingsFromDto,
  validateSettingsLocale,
  whatsappLink,
} from '../../src/features/settings/project'

const services = staticContent.services.map(({ slug, title }) => ({ slug, title }))
const stored = settingsFromDto(staticContent.siteSettings)

describe('settings round trip', () => {
  it('stores the launch settings in a shape the validators accept', () => {
    expect(parseFields(settingsGlobalSchema, stored.global)).toEqual({
      ok: true,
      value: stored.global,
    })
    expect(parseFields(settingsLocaleSchema, stored.local)).toEqual({
      ok: true,
      value: stored.local,
    })
    expect(validateSettingsLocale(stored.local)).toEqual({})
  })

  it('projects back to the same public DTO as the static content', () => {
    const dto = projectSiteSettings({
      locale: 'en',
      global: stored.global,
      local: stored.local,
      services,
      media: {
        defaultOgImage: staticContent.siteSettings.brand.defaultOgImage,
        logo: staticContent.siteSettings.brand.logo,
      },
    })
    expect(dto).toEqual(staticContent.siteSettings)
  })
})

describe('optional fields', () => {
  it('returns empty optional fields as null', () => {
    const global: SettingsGlobal = {
      ...stored.global,
      contact: { ...stored.global.contact, address: null, legalEntityName: null },
      social: { instagram: null, linkedin: null, tiktok: null, youtube: null, x: null },
    }
    const dto = projectSiteSettings({
      locale: 'en',
      global,
      local: stored.local,
      services,
      media: { defaultOgImage: null, logo: null },
    })
    expect(dto.contact.address).toBeNull()
    expect(dto.contact.legalEntity).toBeNull()
    expect(Object.values(dto.social).every((value) => value === null)).toBe(true)
  })
  it('turns analytics off while no website ID is set', () => {
    const dto = projectSiteSettings({
      locale: 'en',
      global: { ...stored.global, analytics: { enabled: true, umamiWebsiteId: null } },
      local: stored.local,
      services,
      media: { defaultOgImage: null, logo: null },
    })
    expect(dto.analytics.enabled).toBe(false)
  })
})

describe('WhatsApp placeholders', () => {
  it('fills {site}, {product} and {service}', () => {
    expect(fillTemplate('Hi {site}, {product}', { site: 'Sineva', product: 'Agents' })).toBe(
      'Hi Sineva, Agents',
    )
    const local: SettingsLocale = {
      ...stored.local,
      whatsapp: {
        ...stored.local.whatsapp,
        product: 'About {product} at {site}',
        services: [{ serviceSlug: 'ai-build', message: 'Interested in {service}' }],
      },
    }
    const dto = projectSiteSettings({
      locale: 'en',
      global: stored.global,
      local,
      services,
      media: { defaultOgImage: null, logo: null },
    })
    expect(dto.whatsapp.templates.product).toBe('About the Sineva Product Suite at Sineva')
    expect(dto.whatsapp.templates.services).toEqual([
      { serviceSlug: 'ai-build', message: 'Interested in AI Build' },
    ])
  })

  it('rejects unknown placeholders per context', () => {
    const local: SettingsLocale = {
      ...stored.local,
      whatsapp: {
        ...stored.local.whatsapp,
        general: 'Hi {service}',
        services: [{ serviceSlug: 'ai-build', message: 'Hi {name}' }],
      },
    }
    expect(Object.keys(validateSettingsLocale(local)).sort()).toEqual([
      'whatsapp.general',
      'whatsapp.services.0.message',
    ])
  })

  it('requires {title} in the title template', () => {
    const local = { ...stored.local, seo: { ...stored.local.seo, titleTemplate: 'Sineva' } }
    expect(validateSettingsLocale(local)['seo.titleTemplate']).toBeDefined()
  })

  it('keeps one template per current service', () => {
    expect(
      alignServiceTemplates(
        [
          { serviceSlug: 'old', message: 'x' },
          { serviceSlug: 'ai-build', message: 'Build' },
        ],
        [{ slug: 'ai-build' }, { slug: 'ai-new' }],
      ),
    ).toEqual([
      { serviceSlug: 'ai-build', message: 'Build' },
      { serviceSlug: 'ai-new', message: "Hi {site}, I'm interested in {service}. Can we talk?" },
    ])
  })

  it('builds a wa.me link with digits only', () => {
    expect(whatsappLink('+62 851', 'Hi there')).toBe('https://wa.me/62851?text=Hi%20there')
  })
})
