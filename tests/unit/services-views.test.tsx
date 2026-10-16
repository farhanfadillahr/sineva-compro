import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceDetailView } from '@/components/pages/services/service-detail-view'
import { ServicesListView } from '@/components/pages/services/services-list-view'
import {
  loadServiceDetailModel,
  loadServicesListModel,
  planServiceDetailSections,
  planServicesListSections,
  type ServiceDetailModel,
  type ServicesListModel,
} from '@/components/pages/services/services-model'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { checkSectionTones } from '@/components/sections'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import en from '../../messages/en.json'
import { publicFixtures } from '../fixtures/public'
import { installIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, stubMedia } from './sections-test-utils'

const labels = servicesLabelsFromMessages(en)
const SLUGS = ['ai-discovery', 'ai-build', 'ai-enablement'] as const

let listModel: ServicesListModel
const detailModels = {} as Record<string, ServiceDetailModel>

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-services-section]'))
const sectionIds = () => sections().map((el) => el.dataset.servicesSection)
const section = (id: string) =>
  document.querySelector<HTMLElement>(`[data-services-section="${id}"]`)!
const jsonLd = () =>
  Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  ).map((s) => JSON.parse(s.textContent!) as Record<string, unknown>)
const href = (root: HTMLElement, name: string | RegExp) =>
  within(root).getByRole('link', { name }).getAttribute('href')

function withListWork(model: ServicesListModel): ServicesListModel {
  return {
    ...model,
    page: { ...model.page, selectedWork: { ...model.page.selectedWork, visible: true } },
    settings: {
      ...model.settings!,
      features: { ...model.settings!.features, showSelectedWork: true },
    },
    work: publicFixtures.work.slice(0, 3),
  }
}

beforeEach(async () => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  const source = createFixtureContentSource()
  listModel = (await loadServicesListModel(source, 'en'))!
  for (const slug of SLUGS) detailModels[slug] = (await loadServiceDetailModel(source, slug, 'en'))!
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Services list composition', () => {
  const renderList = (m = listModel) => render(<ServicesListView model={m} labels={labels} />)

  it('renders exactly the plan: view and plan cannot drift apart', () => {
    const m = withListWork(listModel)
    renderList(m)
    expect(sectionIds()).toEqual(planServicesListSections(m).map((s) => s.id))
    expect(sectionIds()).toEqual([
      'hero',
      'services',
      'howWeWork',
      'whoWeHelp',
      'selectedWork',
      'faq',
      'finalCta',
    ])
  })

  it('hides Selected work while there is none (the static launch)', () => {
    renderList({ ...listModel, work: [] })
    expect(sectionIds()).not.toContain('selectedWork')
    expect(screen.queryByText(listModel.page.selectedWork.title)).toBeNull()
  })

  it('puts the planned tone on each band and passes the tone rules', () => {
    const m = withListWork(listModel)
    renderList(m)
    const tones = sections().map((el) => el.dataset.servicesTone)
    expect(tones).toEqual(planServicesListSections(m).map((s) => s.tone))
    expect(checkSectionTones(tones as never)).toEqual([])
    expect(document.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('has one main landmark with the skip-link id, focusable, and one h1', () => {
    renderList()
    const mains = document.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe('main-content')
    expect(mains[0]!.getAttribute('tabindex')).toBe('-1')
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]!.textContent).toBe(listModel.page.hero.headline)
  })

  it('renders one card per service with its title, who-it-is-for summary and a link to the detail', () => {
    renderList()
    const cards = section('services').querySelectorAll<HTMLElement>('[data-service-card]')
    expect(cards).toHaveLength(listModel.services.length)
    listModel.services.forEach((service, index) => {
      const card = cards[index]!
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(service.title)
      expect(within(card).getByText(service.summary)).toBeTruthy()
      expect(href(card, labels.cardCta(service.title))).toBe(`/services/${service.slug}`)
    })
  })

  it('shows a pose on each service card', () => {
    renderList()
    const cards = section('services').querySelectorAll<HTMLElement>('[data-service-card]')
    for (const card of cards) expect(card.querySelector('img')).toBeTruthy()
  })

  it('sends the hero CTA to /contact', () => {
    renderList()
    expect(href(section('hero'), listModel.page.hero.primaryCtaLabel)).toBe('/contact')
  })

  it('titles the sections from the page content', () => {
    renderList(withListWork(listModel))
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual(
      expect.arrayContaining([
        listModel.page.servicesIntro.title,
        listModel.page.howWeWork.title,
        listModel.page.whoWeHelp.title,
        listModel.page.selectedWork.title,
        listModel.page.faq.title,
        listModel.page.finalCta.headline,
      ]),
    )
  })

  it('emits one FAQPage matching the visible questions, and no JSON-LD without questions', () => {
    const { unmount } = renderList()
    const data = jsonLd()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ '@context': 'https://schema.org', '@type': 'FAQPage' })
    const names = (data[0]!.mainEntity as { name: string }[]).map((q) => q.name)
    expect(names).toEqual(listModel.faq.map((item) => item.question))
    unmount()
    renderList({ ...listModel, faq: [] })
    expect(jsonLd()).toHaveLength(0)
    expect(sectionIds()).not.toContain('faq')
  })

  it('renders no sticky CTA bar (long-page bar is for the detail page)', () => {
    renderList()
    expect(document.querySelector('[data-slot="sticky-cta-bar"]')).toBeNull()
  })

  it('has no duplicate ids and no critical accessibility violations', async () => {
    const { container } = renderList(withListWork(listModel))
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('uses the link component it is given for internal links', () => {
    const Marked = ({ href: to, children, ...rest }: { href: never; children?: ReactNode }) => (
      <a data-localised="yes" href={to as string} {...rest}>
        {children}
      </a>
    )
    render(<ServicesListView model={listModel} labels={labels} linkComponent={Marked as never} />)
    const link = within(section('services')).getAllByRole('link')[0]!
    expect(link.dataset.localised).toBe('yes')
  })
})

describe.each(SLUGS)('Service detail composition: %s', (slug) => {
  const model = () => detailModels[slug]!
  const renderDetail = (m = model(), props = {}) =>
    render(<ServiceDetailView model={m} labels={labels} {...props} />)

  it('renders every FR-SVC-02 section in the planned order', () => {
    renderDetail()
    expect(sectionIds()).toEqual(planServiceDetailSections(model()).map((s) => s.id))
    expect(sectionIds()).toEqual(
      expect.arrayContaining([
        'hero',
        'problems',
        'deliverables',
        'process',
        'tools',
        'faq',
        'finalCta',
      ]),
    )
  })

  it('has one main landmark, one h1 (the service title) and no skipped heading level', () => {
    renderDetail()
    expect(document.querySelectorAll('main')).toHaveLength(1)
    expect(document.querySelector('main')!.id).toBe('main-content')
    expect(document.querySelector('main')!.getAttribute('tabindex')).toBe('-1')
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]!.textContent).toBe(model().service.title)
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    levels.reduce((previous, level) => {
      expect(level - previous).toBeLessThanOrEqual(1)
      return level
    }, 0)
  })

  it('shows the breadcrumb Home > Services > service with the current page marked', () => {
    renderDetail()
    const nav = screen.getByRole('navigation', { name: labels.breadcrumbLabel })
    const items = within(nav).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      labels.homeCrumb,
      labels.servicesCrumb,
      model().service.title,
    ])
    expect(within(items[0]!).getByRole('link').getAttribute('href')).toBe('/')
    expect(within(items[1]!).getByRole('link').getAttribute('href')).toBe('/services')
    expect(within(items[2]!).queryByRole('link')).toBeNull()
    expect(items[2]!.querySelector('[aria-current="page"]')).toBeTruthy()
  })

  it('sends the hero CTA to /contact with ?service=<slug>', () => {
    renderDetail()
    expect(href(section('hero'), model().service.ctaLabel)).toBe(`/contact?service=${slug}`)
  })

  it('sends the final CTA to /contact with ?service=<slug>', () => {
    renderDetail()
    expect(href(section('finalCta'), model().service.ctaLabel)).toBe(`/contact?service=${slug}`)
  })

  it('opens WhatsApp with the message of this service in the final CTA', () => {
    renderDetail()
    const wa = href(section('finalCta'), labels.chatOnWhatsapp)!
    const template = model().settings!.whatsapp.templates.services.find(
      (s) => s.serviceSlug === slug,
    )!.message
    expect(wa.startsWith('https://wa.me/')).toBe(true)
    expect(decodeURIComponent(wa.split('?text=')[1]!)).toBe(
      template.replaceAll('{service name}', model().service.title),
    )
  })

  it('lists the problems, the deliverables with check icons, the steps and the tools as text', () => {
    renderDetail()
    const { service } = model()
    const problems = section('problems')
    for (const problem of service.problems) {
      expect(within(problems).getByRole('heading', { level: 3, name: problem.title })).toBeTruthy()
      expect(within(problems).getByText(problem.body)).toBeTruthy()
    }
    const deliverables = section('deliverables')
    const items = within(deliverables).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(service.deliverables)
    for (const item of items) expect(item.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    const steps = within(section('process')).getAllByRole('listitem')
    expect(steps).toHaveLength(service.process.length)
    service.process.forEach((step, i) => {
      expect(steps[i]!.textContent).toContain(step.title)
      expect(steps[i]!.textContent).toContain(step.body)
    })
    const tools = within(section('tools')).getAllByRole('listitem')
    expect(tools.map((li) => li.textContent)).toEqual(service.tools)
    expect(section('tools').querySelector('img, svg:not([aria-hidden="true"])')).toBeNull()
  })

  it('emits Service, BreadcrumbList and FAQPage JSON-LD that match the page', () => {
    renderDetail()
    const data = jsonLd()
    expect(data.map((d) => d['@type']).sort()).toEqual(['BreadcrumbList', 'FAQPage', 'Service'])
    const svc = data.find((d) => d['@type'] === 'Service')!
    expect(svc).toMatchObject({
      '@context': 'https://schema.org',
      name: model().service.title,
      description: model().service.summary,
      url: `/services/${slug}`,
    })
    const crumbs = data.find((d) => d['@type'] === 'BreadcrumbList')!.itemListElement as {
      position: number
      name: string
    }[]
    expect(crumbs.map((c) => c.position)).toEqual([1, 2, 3])
    expect(crumbs.at(-1)!.name).toBe(model().service.title)
    const faq = data.find((d) => d['@type'] === 'FAQPage')!.mainEntity as { name: string }[]
    expect(faq.map((q) => q.name)).toEqual(model().faq.map((item) => item.question))
  })

  it('uses the site origin in the JSON-LD urls when it is given', () => {
    renderDetail(model(), { origin: 'https://sineva.example' })
    const svc = jsonLd().find((d) => d['@type'] === 'Service')!
    expect(svc.url).toBe(`https://sineva.example/services/${slug}`)
  })

  it('passes the tone rules and keeps one inverse section', () => {
    renderDetail()
    const tones = sections().map((el) => el.dataset.servicesTone)
    expect(checkSectionTones(tones as never)).toEqual([])
    expect(document.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('has no duplicate ids and no critical accessibility violations', async () => {
    const { container } = renderDetail()
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('makes only the hero pose a high priority image', () => {
    renderDetail()
    const high = Array.from(document.querySelectorAll('img[fetchpriority="high"]'))
    expect(high).toHaveLength(1)
    expect(section('hero').contains(high[0]!)).toBe(true)
  })
})

describe('Service detail optional parts', () => {
  const m = () => detailModels['ai-build']!
  const renderDetail = (model: ServiceDetailModel, props = {}) =>
    render(<ServiceDetailView model={model} labels={labels} {...props} />)

  it('shows related work (with the demo badge) when there is some', () => {
    renderDetail({
      ...m(),
      work: [{ ...publicFixtures.work[0]!, serviceSlug: 'ai-build', projectType: 'internal-demo' }],
    })
    expect(sectionIds()).toContain('relatedWork')
    expect(within(section('relatedWork')).getByText(labels.internalDemo)).toBeTruthy()
    expect(within(section('relatedWork')).getByRole('heading', { level: 2 }).textContent).toBe(
      labels.detail.relatedWorkTitle,
    )
  })

  it('hides related work, heading included, when there is none (the static launch)', () => {
    renderDetail({ ...m(), work: [] })
    expect(sectionIds()).not.toContain('relatedWork')
    expect(screen.queryByText(labels.detail.relatedWorkTitle)).toBeNull()
  })

  it('hides the FAQ and its JSON-LD without questions, keeping Service and BreadcrumbList', () => {
    renderDetail({ ...m(), faq: [] })
    expect(sectionIds()).not.toContain('faq')
    expect(
      jsonLd()
        .map((d) => d['@type'])
        .sort(),
    ).toEqual(['BreadcrumbList', 'Service'])
  })

  it('drops the WhatsApp CTA without a usable number, keeping the contact CTA', () => {
    const settings = m().settings!
    renderDetail({
      ...m(),
      settings: { ...settings, whatsapp: { ...settings.whatsapp, number: 'x' } },
    })
    expect(
      within(section('finalCta')).queryByRole('link', { name: labels.chatOnWhatsapp }),
    ).toBeNull()
    expect(href(section('finalCta'), m().service.ctaLabel)).toBe('/contact?service=ai-build')
  })

  it('renders the sticky CTA bar on mobile only, wired to the contact CTA with the service', () => {
    stubMedia({ '(min-width: 1024px)': false })
    renderDetail(m(), { stickyPrimaryHref: '/contact?service=ai-build' })
    const bar = document.querySelector<HTMLElement>('[data-slot="sticky-cta-bar"]')!
    expect(bar).toBeTruthy()
    expect(bar.getAttribute('aria-label')).toBe(labels.stickyBarLabel)
    expect(
      within(bar)
        .getByRole('link', { name: m().service.ctaLabel, hidden: true })
        .getAttribute('href'),
    ).toBe('/contact?service=ai-build')
  })

  it('renders no sticky CTA bar on desktop', () => {
    stubMedia({ '(min-width: 1024px)': true })
    renderDetail(m())
    expect(document.querySelector('[data-slot="sticky-cta-bar"]')).toBeNull()
  })

  it('renders no sticky CTA bar when the site setting is off', () => {
    stubMedia({})
    const settings = m().settings!
    renderDetail({
      ...m(),
      settings: { ...settings, features: { ...settings.features, enableStickyCtaBar: false } },
    })
    expect(document.querySelector('[data-slot="sticky-cta-bar"]')).toBeNull()
  })

  it('observes the hero CTA and the final CTA so the bar hides at the end', () => {
    renderDetail(m())
    expect(document.getElementById('hero-cta')).toBeTruthy()
    expect(document.getElementById('final-cta')).toBeTruthy()
  })
})
