import { describe, expect, it, vi } from 'vitest'
import { checkSectionTones } from '../../src/components/sections/_internal/tone'
import {
  heroSecondaryHref,
  loadHomeModel,
  planHomeSections,
  type HomeModel,
} from '../../src/components/pages/home/home-model'
import { homeLabelsFromMessages } from '../../src/components/pages/home/home-labels'
import { buildHomeMetadata } from '../../src/components/pages/home/home-metadata'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import type { PublicContentSource } from '../../src/features/content/public'
import { publicFixtures } from '../fixtures/public'

const source = () => createFixtureContentSource()

async function fixtureModel(overrides: Partial<HomeModel> = {}): Promise<HomeModel> {
  const model = await loadHomeModel(source(), 'en')
  if (!model) throw new Error('fixture home model missing')
  return { ...model, ...overrides }
}

const ids = (model: HomeModel) => planHomeSections(model).map((section) => section.id)

describe('planHomeSections', () => {
  it('follows page-patterns 2.1 for a fully populated page', async () => {
    const model = await fixtureModel({
      work: publicFixtures.work.filter((item) => item.featured).slice(0, 3),
      posts: publicFixtures.posts.slice(0, 3),
    })
    expect(ids(model)).toEqual([
      'hero',
      'twoPaths',
      'meetSino',
      'capabilities',
      'howWeWork',
      'whoWeHelp',
      'selectedWork',
      'fromBlog',
      'faq',
      'finalCta',
    ])
  })

  it('uses the tones of page-patterns 2.1 and passes checkSectionTones', async () => {
    const model = await fixtureModel({
      work: publicFixtures.work.slice(0, 1),
      posts: publicFixtures.posts.slice(0, 1),
    })
    const plan = planHomeSections(model)
    expect(Object.fromEntries(plan.map((s) => [s.id, s.tone]))).toEqual({
      hero: 'aurora',
      twoPaths: 'canvas',
      meetSino: 'tint',
      capabilities: 'canvas',
      howWeWork: 'alt',
      whoWeHelp: 'canvas',
      selectedWork: 'canvas',
      fromBlog: 'alt',
      faq: 'canvas',
      finalCta: 'inverse',
    })
    expect(checkSectionTones(plan.map((s) => s.tone))).toEqual([])
  })

  it('hides selected work and the blog when their lists are empty', async () => {
    const model = await fixtureModel({ work: [], posts: [] })
    expect(ids(model)).not.toContain('selectedWork')
    expect(ids(model)).not.toContain('fromBlog')
  })

  it('hides a section whose data is empty instead of leaving an empty heading', async () => {
    const model = await fixtureModel({
      capabilities: [],
      faq: [],
      page: {
        ...(await fixtureModel()).page,
        howWeWork: { title: 'x', steps: [] },
        whoWeHelp: { title: 'x', cards: [] },
      },
    })
    for (const hidden of ['capabilities', 'howWeWork', 'whoWeHelp', 'faq']) {
      expect(ids(model)).not.toContain(hidden)
    }
    expect(ids(model)[0]).toBe('hero')
    expect(ids(model).at(-1)).toBe('finalCta')
  })

  it('recomputes tones after hiding so two alt sections never become neighbours', async () => {
    // Who we help and selected work hidden: How we work (alt) would touch From the blog (alt).
    const base = await fixtureModel()
    const model: HomeModel = {
      ...base,
      work: [],
      posts: publicFixtures.posts.slice(0, 3),
      page: { ...base.page, whoWeHelp: { title: 'x', cards: [] } },
    }
    const plan = planHomeSections(model)
    expect(plan.map((s) => s.id)).toEqual(expect.arrayContaining(['howWeWork', 'fromBlog']))
    expect(checkSectionTones(plan.map((s) => s.tone))).toEqual([])
  })

  it('keeps the tone rules for every combination of optional sections', async () => {
    const base = await fixtureModel()
    const work = publicFixtures.work.slice(0, 3)
    const posts = publicFixtures.posts.slice(0, 3)
    const empty = { title: 'x', steps: [], cards: [] }
    for (const hasWork of [true, false]) {
      for (const hasPosts of [true, false]) {
        for (const hasWho of [true, false]) {
          for (const hasSteps of [true, false]) {
            for (const hasCaps of [true, false]) {
              const model: HomeModel = {
                ...base,
                work: hasWork ? work : [],
                posts: hasPosts ? posts : [],
                capabilities: hasCaps ? base.capabilities : [],
                page: {
                  ...base.page,
                  whoWeHelp: hasWho ? base.page.whoWeHelp : { ...empty, cards: [] },
                  howWeWork: hasSteps ? base.page.howWeWork : { ...empty, steps: [] },
                },
              }
              const tones = planHomeSections(model).map((s) => s.tone)
              expect(checkSectionTones(tones)).toEqual([])
              expect(tones.filter((tone) => tone === 'inverse')).toHaveLength(1)
            }
          }
        }
      }
    }
  })
})

describe('loadHomeModel', () => {
  it('returns null when the page has no content for the locale', async () => {
    expect(await loadHomeModel(source(), 'nl' as never)).toBeNull()
  })

  it('shows only featured work, at most three', async () => {
    const featured = publicFixtures.work.filter((item) => item.featured)
    const many = [...featured, ...featured, ...featured, ...featured].map((item, index) => ({
      ...item,
      slug: `${item.slug}-${index}`,
    }))
    const stub: PublicContentSource = {
      ...source(),
      listWork: async () => [...many, { ...many[0]!, slug: 'not-featured', featured: false }],
    }
    const model = await loadHomeModel(stub, 'en')
    expect(model!.work.length).toBeLessThanOrEqual(3)
    expect(model!.work.every((item) => item.featured)).toBe(true)
  })

  it('asks the source for featured work only', async () => {
    const listWork = vi.fn(async () => [])
    await loadHomeModel({ ...source(), listWork }, 'en')
    expect(listWork).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en', featured: true }))
  })

  it('does not query work when the page content or the site settings switch it off', async () => {
    const real = source()
    const page = (await real.getPage('home', 'en'))!
    const settings = (await real.getSiteSettings('en'))!
    const listWork = vi.fn(async () => [...publicFixtures.work])

    const pageOff: PublicContentSource = {
      ...real,
      listWork,
      getPage: async (key, locale) =>
        key === 'home'
          ? ({ ...page, selectedWork: { ...page.selectedWork, visible: false } } as never)
          : real.getPage(key, locale),
    }
    expect((await loadHomeModel(pageOff, 'en'))!.work).toEqual([])

    const settingsOff: PublicContentSource = {
      ...real,
      listWork,
      getSiteSettings: async () => ({
        ...settings,
        features: { ...settings.features, showSelectedWork: false },
      }),
    }
    expect((await loadHomeModel(settingsOff, 'en'))!.work).toEqual([])
    expect(listWork).not.toHaveBeenCalled()
  })

  it('loads the three latest posts of the page locale, newest first', async () => {
    const listPosts = vi.fn(source().listPosts)
    const model = await loadHomeModel({ ...source(), listPosts }, 'en')
    expect(listPosts).toHaveBeenCalledWith({ locale: 'en', page: 1, pageSize: 3 })
    expect(model!.posts).toHaveLength(3)
    expect(model!.posts.every((post) => post.locale === 'en')).toBe(true)
    const dates = model!.posts.map((post) => post.publishedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('drops posts of another locale even if the source returns them', async () => {
    const posts = publicFixtures.posts.slice(0, 3)
    const stub: PublicContentSource = {
      ...source(),
      listPosts: async () => ({
        posts: [{ ...posts[0]!, locale: 'id' as never }, posts[1]!, posts[2]!],
        total: 3,
        page: 1,
        pageSize: 3,
      }),
    }
    const model = await loadHomeModel(stub, 'en')
    expect(model!.posts).toHaveLength(2)
  })

  it('does not query posts when the blog section is switched off', async () => {
    const real = source()
    const page = (await real.getPage('home', 'en'))!
    const listPosts = vi.fn(real.listPosts)
    const stub: PublicContentSource = {
      ...real,
      listPosts,
      getPage: async (key, locale) =>
        key === 'home'
          ? ({ ...page, fromBlog: { ...page.fromBlog, visible: false } } as never)
          : real.getPage(key, locale),
    }
    expect((await loadHomeModel(stub, 'en'))!.posts).toEqual([])
    expect(listPosts).not.toHaveBeenCalled()
  })

  it('reads the home FAQ and the capabilities of the locale', async () => {
    const listFaq = vi.fn(source().listFaq)
    const listCapabilities = vi.fn(source().listCapabilities)
    const model = await loadHomeModel({ ...source(), listFaq, listCapabilities }, 'en')
    expect(listFaq).toHaveBeenCalledWith('home', 'en')
    expect(listCapabilities).toHaveBeenCalledWith('en')
    expect(model!.faq.length).toBeGreaterThan(0)
  })

  it('defaults the product status to coming soon when the product page is missing', async () => {
    const stub: PublicContentSource = {
      ...source(),
      getPage: async (key, locale) => (key === 'product' ? null : source().getPage(key, locale)),
    }
    expect((await loadHomeModel(stub, 'en'))!.productStatus).toBe('coming_soon')
  })
})

describe('heroSecondaryHref', () => {
  it('points at the waitlist form while the product is coming soon', () => {
    expect(heroSecondaryHref('coming_soon')).toBe('/products/ai-agents#waitlist')
  })

  it('points at the product page once it is live', () => {
    expect(heroSecondaryHref('live')).toBe('/products/ai-agents')
  })
})

describe('homeLabelsFromMessages', () => {
  it('reads the optional UI labels from the Home namespace', () => {
    expect(
      homeLabelsFromMessages({
        Home: { stickyBarLabel: 'a', comingSoon: 'b', internalDemo: 'c' },
      }),
    ).toEqual({ stickyBarLabel: 'a', comingSoon: 'b', internalDemo: 'c' })
  })

  it('leaves labels undefined when the namespace or a key is missing', () => {
    expect(homeLabelsFromMessages({})).toEqual({})
    expect(homeLabelsFromMessages({ Home: { comingSoon: 42 } })).toEqual({})
    expect(homeLabelsFromMessages(null)).toEqual({})
  })
})

describe('buildHomeMetadata', () => {
  it('uses the page SEO fields verbatim as the title, with canonical "/"', async () => {
    const { page, settings } = await fixtureModel()
    const metadata = buildHomeMetadata(page, settings)
    expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
    expect(metadata.description).toBe(page.seo.metaDescription)
    expect(metadata.alternates?.canonical).toBe('/')
  })

  it('does not touch robots unless the page itself is noindex', async () => {
    const { page, settings } = await fixtureModel()
    expect(buildHomeMetadata(page, settings).robots).toBeUndefined()
    const noindex = buildHomeMetadata({ ...page, seo: { ...page.seo, noindex: true } }, settings)
    expect(noindex.robots).toEqual({ index: false, follow: false })
  })

  it('honours an advanced canonical override from the CMS', async () => {
    const { page, settings } = await fixtureModel()
    const metadata = buildHomeMetadata(
      { ...page, seo: { ...page.seo, canonicalUrl: 'https://example.com/' } },
      settings,
    )
    expect(metadata.alternates?.canonical).toBe('https://example.com/')
  })

  it('falls back to the site default Open Graph image', async () => {
    const { page, settings } = await fixtureModel()
    const og = buildHomeMetadata(page, settings).openGraph
    expect(og?.title).toBe(page.seo.metaTitle)
    expect(JSON.stringify(og?.images)).toContain(settings!.brand.defaultOgImage!.url)
  })

  it('works without site settings', async () => {
    const { page } = await fixtureModel()
    expect(buildHomeMetadata(page, null).title).toEqual({ absolute: page.seo.metaTitle })
  })
})
