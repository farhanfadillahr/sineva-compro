import { describe, expect, it, vi } from 'vitest'
import { checkSectionTones } from '@/components/sections/_internal/tone'
import {
  loadProductModel,
  planProductSections,
  productActionHref,
  waitlistChannelsFor,
  type ProductModel,
} from '@/components/pages/product/product-model'
import { productLabelsFromMessages } from '@/components/pages/product/product-labels'
import { buildProductMetadata } from '@/components/pages/product/product-metadata'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import type { PublicContentSource } from '../../src/features/content/public'
import { createStaticContentSource } from '../../src/content/static'
import { validatePublicCopy } from '../../src/lib/copy'
import en from '../../messages/en.json'

async function fixtureModel(overrides: Partial<ProductModel> = {}): Promise<ProductModel> {
  const model = await loadProductModel(createFixtureContentSource(), 'en')
  if (!model) throw new Error('fixture product model missing')
  return { ...model, ...overrides }
}

const ids = (model: ProductModel) => planProductSections(model).map((section) => section.id)

describe('loadProductModel', () => {
  it('reads the product page, settings, capabilities, industries and the product FAQ', async () => {
    const source = createFixtureContentSource()
    const model = (await loadProductModel(source, 'en'))!
    expect(model.page).toEqual(await source.getPage('product', 'en'))
    expect(model.settings).toEqual(await source.getSiteSettings('en'))
    expect(model.capabilities).toEqual(await source.listCapabilities('en'))
    expect(model.industries).toEqual(await source.listIndustries('en'))
    expect(model.faq).toEqual(await source.listFaq('product', 'en'))
    expect(model.productStatus).toBe(model.page.productStatus)
  })

  it('asks for the FAQ tagged product, not home', async () => {
    const source = createFixtureContentSource()
    const listFaq = vi.spyOn(source, 'listFaq')
    await loadProductModel(source, 'en')
    expect(listFaq).toHaveBeenCalledWith('product', 'en')
    expect(listFaq).not.toHaveBeenCalledWith('home', 'en')
  })

  it('is null when the product page has no content for the locale', async () => {
    const source: PublicContentSource = {
      ...createFixtureContentSource(),
      getPage: async () => null,
    }
    expect(await loadProductModel(source, 'en')).toBeNull()
  })

  it('works with the static launch content', async () => {
    const model = (await loadProductModel(createStaticContentSource(), 'en'))!
    expect(model.productStatus).toBe('coming_soon')
    expect(model.capabilities.length).toBeGreaterThan(0)
    expect(model.industries).toHaveLength(3)
    expect(model.faq.length).toBeGreaterThan(0)
  })
})

describe('planProductSections', () => {
  it('follows page-patterns 2.2 and leaves the comparison out of phase 1', async () => {
    expect(ids(await fixtureModel())).toEqual([
      'hero',
      'capabilities',
      'howItWorks',
      'madeForYou',
      'control',
      'faq',
      'finalCta',
    ])
  })

  it('never plans the comparison, even when the content switches it on', async () => {
    const model = await fixtureModel()
    const on = {
      ...model,
      page: { ...model.page, comparison: { ...model.page.comparison, visible: true } },
    }
    expect(ids(on)).not.toContain('comparison' as never)
  })

  it('uses the tones of page-patterns 2.2 and passes checkSectionTones', async () => {
    const plan = planProductSections(await fixtureModel())
    expect(Object.fromEntries(plan.map((s) => [s.id, s.tone]))).toEqual({
      hero: 'aurora',
      capabilities: 'canvas',
      howItWorks: 'alt',
      madeForYou: 'canvas',
      control: 'tint',
      faq: 'canvas',
      finalCta: 'inverse',
    })
    expect(checkSectionTones(plan.map((s) => s.tone))).toEqual([])
  })

  it('hides a section whose list is empty, so no heading sits over nothing', async () => {
    const model = await fixtureModel()
    expect(ids({ ...model, capabilities: [] })).not.toContain('capabilities')
    expect(ids({ ...model, industries: [] })).not.toContain('madeForYou')
    expect(ids({ ...model, faq: [] })).not.toContain('faq')
    expect(
      ids({
        ...model,
        page: { ...model.page, howItWorks: { ...model.page.howItWorks, steps: [] } },
      }),
    ).not.toContain('howItWorks')
    expect(
      ids({
        ...model,
        page: { ...model.page, control: { ...model.page.control, features: [] } },
      }),
    ).not.toContain('control')
  })

  it('never leaves two non-white bands side by side after hiding sections', async () => {
    const model = await fixtureModel()
    for (const patch of [
      { capabilities: [] },
      { industries: [] },
      { capabilities: [], industries: [] },
      { faq: [] },
    ] as Partial<ProductModel>[]) {
      const plan = planProductSections({ ...model, ...patch })
      expect(checkSectionTones(plan.map((s) => s.tone))).toEqual([])
    }
  })
})

describe('waitlistChannelsFor', () => {
  it('takes the number and greeting from the site settings, and no email while it is null', async () => {
    const settings = (await createStaticContentSource().getSiteSettings('en'))!
    const channels = waitlistChannelsFor(settings)!
    expect(channels.whatsappNumber).toBe(settings.whatsapp.number)
    expect(channels.greeting).toBe(settings.whatsapp.templates.product)
    expect(channels.email).toBeNull()
  })

  it('carries the public email once one is confirmed', async () => {
    const settings = (await createFixtureContentSource().getSiteSettings('en'))!
    expect(waitlistChannelsFor(settings)!.email).toBe(settings.contact.email)
  })

  it('is null without settings, and when neither a number nor an email is usable', async () => {
    expect(waitlistChannelsFor(null)).toBeNull()
    const settings = (await createStaticContentSource().getSiteSettings('en'))!
    expect(
      waitlistChannelsFor({ ...settings, whatsapp: { ...settings.whatsapp, number: 'nope' } }),
    ).toBeNull()
  })

  it('still works by email alone', async () => {
    const settings = (await createFixtureContentSource().getSiteSettings('en'))!
    const channels = waitlistChannelsFor({
      ...settings,
      whatsapp: { ...settings.whatsapp, number: 'nope' },
    })!
    expect(channels.whatsappNumber).toBeNull()
    expect(channels.email).toBe(settings.contact.email)
  })
})

describe('productActionHref', () => {
  it('points at the waitlist form while coming soon and at the product WhatsApp chat when live', async () => {
    const settings = (await createStaticContentSource().getSiteSettings('en'))!
    expect(productActionHref('coming_soon', settings)).toBe('/products/ai-agents#waitlist')
    expect(productActionHref('live', settings)!.startsWith('https://wa.me/')).toBe(true)
    expect(productActionHref('live', null)).toBe('/contact')
  })
})

describe('Product UI labels in messages/en.json', () => {
  const labels = productLabelsFromMessages(en)

  it('ships every label the Product page reads', () => {
    expect(labels.comingSoon).toBeTruthy()
    expect(labels.stickyBarLabel).toBeTruthy()
    expect(labels.tabsLabel).toBeTruthy()
    for (const [key, value] of Object.entries(labels.waitlist)) {
      expect(value, key).toBeTruthy()
    }
  })

  it('follows the copy rules (no dash, no em dash entity)', () => {
    const all = [
      labels.comingSoon,
      labels.stickyBarLabel,
      labels.tabsLabel,
      ...Object.values(labels.waitlist),
    ]
    for (const value of all) expect(validatePublicCopy(value).ok, value).toBe(true)
  })

  it('throws on a missing label instead of rendering a blank control', () => {
    expect(() => productLabelsFromMessages({})).toThrow(/Product/)
    expect(() => productLabelsFromMessages({ Product: { comingSoon: 'x' } })).toThrow()
    expect(() => productLabelsFromMessages(null)).toThrow()
  })
})

describe('buildProductMetadata', () => {
  it('takes title, description and canonical from the page SEO, with an absolute title', async () => {
    const model = (await loadProductModel(createStaticContentSource(), 'en'))!
    const metadata = buildProductMetadata(model.page, model.settings)
    expect(metadata.title).toEqual({ absolute: model.page.seo.metaTitle })
    expect(metadata.description).toBe(model.page.seo.metaDescription)
    expect(metadata.alternates?.canonical).toBe('/products/ai-agents')
    expect(metadata.openGraph?.title).toBe(model.page.seo.metaTitle)
    expect(metadata.openGraph?.description).toBe(model.page.seo.metaDescription)
    expect(model.page.seo.metaTitle.length).toBeLessThanOrEqual(60)
    expect(model.page.seo.metaDescription.length).toBeLessThanOrEqual(160)
  })

  it('uses the editor canonical, falls back to the site default OG image, and honours noindex', async () => {
    const model = (await loadProductModel(createStaticContentSource(), 'en'))!
    const page = {
      ...model.page,
      seo: { ...model.page.seo, canonicalUrl: '/x', noindex: true, ogImage: null },
    }
    const metadata = buildProductMetadata(page, model.settings)
    expect(metadata.alternates?.canonical).toBe('/x')
    expect(metadata.robots).toEqual({ index: false, follow: false })
    const images = (metadata.openGraph as { images?: { url: string }[] }).images
    expect(images?.[0]?.url).toBe(model.settings!.brand.defaultOgImage!.url)
  })

  it('does not set robots when the page is indexable (the layout owns the site-wide policy)', async () => {
    const model = (await loadProductModel(createStaticContentSource(), 'en'))!
    expect(buildProductMetadata(model.page, model.settings).robots).toBeUndefined()
  })
})
