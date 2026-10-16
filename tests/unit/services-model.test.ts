import { describe, expect, it } from 'vitest'
import { checkSectionTones } from '@/components/sections'
import {
  loadServiceDetailModel,
  loadServicesListModel,
  planServiceDetailSections,
  planServicesListSections,
  serviceContactHref,
  serviceDetailHref,
  SERVICES_LIST_WORK_LIMIT,
  type ServiceDetailModel,
  type ServicesListModel,
} from '@/components/pages/services/services-model'
import type { ServicesOverviewPageContent } from '@/features/content/types'
import { createStaticContentSource } from '../../src/content/static'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import { publicFixtures } from '../fixtures/public'

const SLUGS = ['ai-discovery', 'ai-build', 'ai-enablement'] as const

describe('service hrefs', () => {
  it('builds the contact CTA with the service slug as the ?service= value', () => {
    expect(serviceContactHref('ai-build')).toBe('/contact?service=ai-build')
  })

  it('encodes a slug so it can never break out of the query string', () => {
    expect(serviceContactHref('a&b=c')).toBe('/contact?service=a%26b%3Dc')
  })

  it('links a service to its detail page', () => {
    expect(serviceDetailHref('ai-discovery')).toBe('/services/ai-discovery')
  })
})

describe('loadServicesListModel', () => {
  it('loads page, services and the FAQ tagged "services" from the static source', async () => {
    const model = await loadServicesListModel(createStaticContentSource(), 'en')
    expect(model).not.toBeNull()
    expect(model!.page.key).toBe('servicesOverview')
    expect(model!.services.map((s) => s.slug)).toEqual([...SLUGS])
    expect(model!.faq.length).toBeGreaterThan(0)
  })

  it('asks for the "services" FAQ tag and nothing else', async () => {
    const base = createFixtureContentSource()
    const tags: string[] = []
    const model = await loadServicesListModel(
      {
        ...base,
        listFaq: (tag, locale) => {
          tags.push(tag)
          return base.listFaq(tag, locale)
        },
      },
      'en',
    )
    expect(tags).toEqual(['services'])
    expect(model!.faq).toHaveLength(
      publicFixtures.faq.filter((entry) => entry.tags.includes('services')).length,
    )
  })

  // The site setting is forced on, so only the page toggle decides in these two cases.
  async function loadWithToggle(visible: boolean) {
    const base = createFixtureContentSource()
    let called = false
    const model = await loadServicesListModel(
      {
        ...base,
        getSiteSettings: async (locale) => {
          const settings = await base.getSiteSettings(locale)
          return { ...settings!, features: { ...settings!.features, showSelectedWork: true } }
        },
        getPage: async (key, locale) => {
          const page = await base.getPage(key, locale)
          if (key !== 'servicesOverview') return page
          const overview = page as ServicesOverviewPageContent
          return {
            ...overview,
            selectedWork: { ...overview.selectedWork, visible },
          } as never
        },
        listWork: (input) => {
          called = true
          return base.listWork(input)
        },
      },
      'en',
    )
    return { called, model: model! }
  }

  it('does not query work while the page content toggle is off', async () => {
    const { called, model } = await loadWithToggle(false)
    expect(called).toBe(false)
    expect(model.work).toEqual([])
  })

  it('queries work when the page toggle and the site setting are both on', async () => {
    const { called, model } = await loadWithToggle(true)
    expect(called).toBe(true)
    expect(model.work.length).toBeGreaterThan(0)
  })

  it('caps the work cards at the limit', async () => {
    const base = createFixtureContentSource()
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...publicFixtures.work[0]!,
      slug: `w-${i}`,
    }))
    const model = await loadServicesListModel({ ...base, listWork: async () => many }, 'en')
    expect(model!.work.length).toBeLessThanOrEqual(SERVICES_LIST_WORK_LIMIT)
  })

  it('resolves to null when the page has no content for the locale', async () => {
    const base = createFixtureContentSource()
    expect(await loadServicesListModel({ ...base, getPage: async () => null }, 'en')).toBeNull()
  })
})

describe('loadServiceDetailModel', () => {
  it.each(SLUGS)('loads %s with its own FAQ tag and related work', async (slug) => {
    const base = createFixtureContentSource()
    const asked: string[] = []
    const model = await loadServiceDetailModel(
      {
        ...base,
        listFaq: (tag, locale) => {
          asked.push(tag)
          return base.listFaq(tag, locale)
        },
      },
      slug,
      'en',
    )
    expect(model!.service.slug).toBe(slug)
    expect(asked).toEqual([`service:${slug}`])
    expect(model!.work.every((item) => item.serviceSlug === slug)).toBe(true)
  })

  it('resolves to null for an unknown slug, which the page turns into a 404', async () => {
    expect(await loadServiceDetailModel(createStaticContentSource(), 'unknown', 'en')).toBeNull()
  })

  it('has no Web Development service (it is part of AI Build)', async () => {
    const source = createStaticContentSource()
    expect(await loadServiceDetailModel(source, 'web-development', 'en')).toBeNull()
  })

  it('drops work that belongs to another service even if the source returns it', async () => {
    const base = createFixtureContentSource()
    const model = await loadServiceDetailModel(
      { ...base, listWork: async () => publicFixtures.work },
      'ai-build',
      'en',
    )
    expect(model!.work.length).toBeGreaterThan(0)
    expect(model!.work.every((item) => item.serviceSlug === 'ai-build')).toBe(true)
  })
})

describe('section plans', () => {
  async function list(patch?: (m: ServicesListModel) => ServicesListModel) {
    const m = (await loadServicesListModel(createFixtureContentSource(), 'en'))!
    return patch ? patch(m) : m
  }
  async function detail(slug: string, patch?: (m: ServiceDetailModel) => ServiceDetailModel) {
    const m = (await loadServiceDetailModel(createFixtureContentSource(), slug, 'en'))!
    return patch ? patch(m) : m
  }

  it('orders the list page as page-patterns 2.3', async () => {
    const withWork = await list((m) => ({
      ...m,
      page: { ...m.page, selectedWork: { ...m.page.selectedWork, visible: true } },
      settings: { ...m.settings!, features: { ...m.settings!.features, showSelectedWork: true } },
      work: publicFixtures.work.slice(0, 3),
    }))
    expect(planServicesListSections(withWork).map((s) => s.id)).toEqual([
      'hero',
      'services',
      'howWeWork',
      'whoWeHelp',
      'selectedWork',
      'faq',
      'finalCta',
    ])
  })

  it('hides Selected work while there is none, and never pairs two tinted bands', async () => {
    const m = await list((x) => ({ ...x, work: [] }))
    const plan = planServicesListSections(m)
    expect(plan.map((s) => s.id)).not.toContain('selectedWork')
    expect(checkSectionTones(plan.map((s) => s.tone))).toEqual([])
  })

  it('hides Selected work when the site setting is off', async () => {
    const m = await list((x) => ({
      ...x,
      settings: { ...x.settings!, features: { ...x.settings!.features, showSelectedWork: false } },
      work: publicFixtures.work.slice(0, 3),
    }))
    expect(planServicesListSections(m).map((s) => s.id)).not.toContain('selectedWork')
  })

  it('hides Selected work when the page toggle is off', async () => {
    const m = await list((x) => ({
      ...x,
      page: { ...x.page, selectedWork: { ...x.page.selectedWork, visible: false } },
      work: publicFixtures.work.slice(0, 3),
    }))
    expect(planServicesListSections(m).map((s) => s.id)).not.toContain('selectedWork')
  })

  it('drops the FAQ section without questions', async () => {
    const m = await list((x) => ({ ...x, faq: [] }))
    expect(planServicesListSections(m).map((s) => s.id)).not.toContain('faq')
  })

  it('orders the detail page as page-patterns 2.4 with related work shown', async () => {
    const m = await detail('ai-build')
    expect(m.work.length).toBeGreaterThan(0)
    expect(planServiceDetailSections(m).map((s) => s.id)).toEqual([
      'hero',
      'problems',
      'deliverables',
      'process',
      'tools',
      'relatedWork',
      'faq',
      'finalCta',
    ])
  })

  it('hides related work when there is none', async () => {
    const m = await detail('ai-build', (x) => ({ ...x, work: [] }))
    expect(planServiceDetailSections(m).map((s) => s.id)).not.toContain('relatedWork')
  })

  it('hides related work when the site setting is off', async () => {
    const m = await detail('ai-build', (x) => ({
      ...x,
      settings: { ...x.settings!, features: { ...x.settings!.features, showSelectedWork: false } },
    }))
    expect(planServiceDetailSections(m).map((s) => s.id)).not.toContain('relatedWork')
  })

  it('every combination of hidden sections passes the tone rules', async () => {
    const m = await detail('ai-build')
    const variants: ServiceDetailModel[] = []
    for (const work of [m.work, []]) {
      for (const faq of [m.faq, []]) {
        for (const tools of [m.service.tools, []]) {
          for (const process of [m.service.process, []]) {
            for (const problems of [m.service.problems, []]) {
              variants.push({
                ...m,
                work,
                faq,
                service: { ...m.service, tools, process, problems },
              })
            }
          }
        }
      }
    }
    expect(variants.length).toBe(32)
    for (const variant of variants) {
      const tones = planServiceDetailSections(variant).map((s) => s.tone)
      expect(checkSectionTones(tones), JSON.stringify(tones)).toEqual([])
    }
  })

  it('has exactly one inverse section, the final CTA, on both pages', async () => {
    const l = planServicesListSections(await list())
    const d = planServiceDetailSections(await detail('ai-discovery'))
    for (const plan of [l, d]) {
      expect(plan.filter((s) => s.tone === 'inverse').map((s) => s.id)).toEqual(['finalCta'])
      expect(plan[0]).toMatchObject({ id: 'hero', tone: 'aurora' })
    }
  })
})
