import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeView, type HomeViewProps } from '@/components/pages/home/home-view'
import { loadHomeModel, planHomeSections, type HomeModel } from '@/components/pages/home/home-model'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import { publicFixtures } from '../fixtures/public'
import { installIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, DESKTOP, image, stubMedia } from './sections-test-utils'

const labels = { stickyBarLabel: 'Next steps', comingSoon: 'Soon', internalDemo: 'Demo project' }

let base: HomeModel

function withHome(patch: (page: HomeModel['page']) => Partial<HomeModel['page']>): HomeModel {
  return { ...base, page: { ...base.page, ...patch(base.page) } as HomeModel['page'] }
}

function withSettings(
  patch: (features: NonNullable<HomeModel['settings']>['features']) => object,
): HomeModel {
  const settings = base.settings!
  return {
    ...base,
    settings: { ...settings, features: { ...settings.features, ...patch(settings.features) } },
  }
}

function renderHome(m: HomeModel, props: Partial<HomeViewProps> = {}) {
  return render(<HomeView model={m} labels={labels} {...props} />)
}

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-home-section]'))
const sectionIds = () => sections().map((el) => el.dataset.homeSection)

beforeEach(async () => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  const loaded = await loadHomeModel(createFixtureContentSource(), 'en')
  base = {
    ...loaded!,
    // A local poster keeps next/image away from the placeholder media host of the fixtures.
    page: {
      ...loaded!.page,
      hero: { ...loaded!.page.hero, poster: image('Sino waving', 1600, 900) },
    },
    work: publicFixtures.work.filter((item) => item.featured),
    posts: publicFixtures.posts.slice(0, 3),
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Home composition', () => {
  it('renders the sections in the order of page-patterns 2.1', () => {
    renderHome(base)
    expect(sectionIds()).toEqual([
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

  it('renders exactly the plan: view and plan cannot drift apart', () => {
    renderHome(base)
    expect(sectionIds()).toEqual(planHomeSections(base).map((section) => section.id))
  })

  it('puts the planned tone on each section band', () => {
    renderHome(base)
    const plan = planHomeSections(base)
    sections().forEach((wrapper, index) => {
      const planned = plan[index]!
      expect(wrapper.dataset.homeTone).toBe(planned.tone)
      if (planned.id === 'finalCta') {
        // The band is canvas; the rounded panel inside it is the one inverse surface.
        expect(wrapper.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
      } else if (planned.id === 'twoPaths') {
        expect(wrapper.querySelector('section')?.getAttribute('data-tone')).toBe('canvas')
      } else {
        expect(wrapper.querySelector('section')?.getAttribute('data-tone')).toBe(planned.tone)
      }
    })
    expect(document.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('wraps everything in one main landmark with the skip-link id', () => {
    renderHome(base)
    const mains = document.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe('main-content')
  })

  it('has exactly one h1, the hero headline, and no skipped heading level', () => {
    renderHome(base)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.textContent).toBe(base.page.hero.headline)
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    levels.reduce((previous, level) => {
      expect(level - previous).toBeLessThanOrEqual(1)
      return level
    }, 0)
  })

  it('keeps the hero headline within ten words', () => {
    expect(base.page.hero.headline.split(/\s+/).length).toBeLessThanOrEqual(10)
  })

  it('titles every visible section with its heading from the page content', () => {
    renderHome(base)
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual(
      expect.arrayContaining([
        base.page.twoPaths.product.title,
        base.page.twoPaths.services.title,
        base.page.meetSino.title,
        base.page.capabilities.title,
        base.page.howWeWork.title,
        base.page.whoWeHelp.title,
        base.page.selectedWork.title,
        base.page.fromBlog.title,
        base.page.faq.title,
        base.page.finalCta.headline,
      ]),
    )
  })

  it('has no duplicate ids inside the page', () => {
    renderHome(base)
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no critical or serious accessibility violations', async () => {
    const { container } = renderHome(base)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('Home hero', () => {
  const hero = () => document.querySelector<HTMLElement>('[data-home-section="hero"]')!

  it('uses the sino-still variant and leaves no canvas slot until the canvas is passed', () => {
    renderHome(base)
    expect(hero().querySelector('section')?.getAttribute('data-variant')).toBe('sino-still')
    expect(document.querySelector('[data-slot="sino-canvas"]')).toBeNull()
  })

  it('renders the realtime canvas in the reserved slot when one is passed', () => {
    renderHome(base, { heroCanvas: <div data-testid="canvas" /> })
    expect(hero().querySelector('section')?.getAttribute('data-variant')).toBe('sino-canvas')
    const slot = document.querySelector('[data-slot="sino-canvas"]')!
    expect(within(slot as HTMLElement).getByTestId('canvas')).toBeTruthy()
  })

  it('renders the poster from the DTO with its size and as the high priority image', () => {
    renderHome(base)
    const poster = hero().querySelector('img')!
    expect(poster.getAttribute('width')).toBe(String(base.page.hero.poster!.width))
    expect(poster.getAttribute('height')).toBe(String(base.page.hero.poster!.height))
    expect(poster.getAttribute('alt')).toBe(base.page.hero.poster!.alt)
    expect(poster.getAttribute('fetchpriority')).toBe('high')
  })

  it('makes only the hero poster high priority', () => {
    renderHome(base)
    const high = Array.from(document.querySelectorAll('img[fetchpriority="high"]'))
    expect(high).toHaveLength(1)
    expect(hero().contains(high[0]!)).toBe(true)
  })

  it('renders without a poster when the content has none', () => {
    renderHome(withHome((page) => ({ hero: { ...page.hero, poster: null } })))
    expect(hero().querySelector('img')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('shows the eyebrow and lead from the content', () => {
    renderHome(base)
    expect(within(hero()).getByText(base.page.hero.lead)).toBeTruthy()
    if (base.page.hero.eyebrow) {
      expect(within(hero()).getByText(base.page.hero.eyebrow)).toBeTruthy()
    }
  })
})

describe('Home CTAs', () => {
  const link = (root: HTMLElement, name: string) =>
    within(root).getByRole('link', { name }).getAttribute('href')
  const heroEl = () => document.querySelector<HTMLElement>('[data-home-section="hero"]')!
  const finalEl = () => document.querySelector<HTMLElement>('[data-home-section="finalCta"]')!

  it('sends the primary hero CTA to /contact and the secondary one to the waitlist form', () => {
    renderHome(base)
    expect(link(heroEl(), base.page.hero.primaryCtaLabel)).toBe('/contact')
    expect(link(heroEl(), base.page.hero.secondaryCtaLabel!)).toBe('/products/ai-agents#waitlist')
  })

  it('switches the secondary CTA to the product page when the product is live', () => {
    renderHome({ ...base, productStatus: 'live' })
    expect(link(heroEl(), base.page.hero.secondaryCtaLabel!)).toBe('/products/ai-agents')
  })

  it('omits the secondary hero CTA when the content has no label for it', () => {
    renderHome(withHome((page) => ({ hero: { ...page.hero, secondaryCtaLabel: null } })))
    expect(within(heroEl()).getAllByRole('link')).toHaveLength(1)
  })

  it('links the two path cards to the product and services pages', () => {
    renderHome(base)
    const paths = document.querySelector<HTMLElement>('[data-home-section="twoPaths"]')!
    expect(link(paths, base.page.twoPaths.product.ctaLabel)).toBe('/products/ai-agents')
    expect(link(paths, base.page.twoPaths.services.ctaLabel)).toBe('/services')
  })

  it('puts both CTAs and a WhatsApp link in the final CTA', () => {
    renderHome(base)
    const final = base.page.finalCta
    expect(link(finalEl(), final.primaryCtaLabel)).toBe('/contact')
    expect(link(finalEl(), final.secondaryCtaLabel!)).toBe('/products/ai-agents#waitlist')
    const wa = link(finalEl(), final.whatsappCtaLabel)!
    const digits = base.settings!.whatsapp.number.replace(/\D/g, '')
    expect(wa.startsWith(`https://wa.me/${digits}?text=`)).toBe(true)
    expect(decodeURIComponent(wa.split('?text=')[1]!)).toBe(
      base.settings!.whatsapp.templates.general,
    )
  })

  it('drops the WhatsApp CTA when the number is unusable, never a dead link', () => {
    const settings = base.settings!
    renderHome({
      ...base,
      settings: { ...settings, whatsapp: { ...settings.whatsapp, number: 'not a number' } },
    })
    expect(
      within(finalEl()).queryByRole('link', { name: base.page.finalCta.whatsappCtaLabel }),
    ).toBeNull()
  })

  it('drops the WhatsApp CTA when there are no site settings', () => {
    renderHome({ ...base, settings: null })
    expect(
      within(finalEl()).queryByRole('link', { name: base.page.finalCta.whatsappCtaLabel }),
    ).toBeNull()
    expect(link(finalEl(), base.page.finalCta.primaryCtaLabel)).toBe('/contact')
  })

  it('uses the link component it is given for internal links, not for WhatsApp', () => {
    const Marked = ({ href, children, ...rest }: { href: never; children?: ReactNode }) => (
      <a data-localised="yes" href={href as string} {...rest}>
        {children}
      </a>
    )
    renderHome(base, { linkComponent: Marked as never })
    expect(
      within(heroEl()).getByRole('link', { name: base.page.hero.primaryCtaLabel }).dataset
        .localised,
    ).toBe('yes')
    expect(
      within(finalEl()).getByRole('link', { name: base.page.finalCta.whatsappCtaLabel }).dataset
        .localised,
    ).toBeUndefined()
  })
})

describe('Home FAQ JSON-LD', () => {
  const scripts = () =>
    Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))

  it('emits one valid FAQPage that matches the visible questions', () => {
    renderHome(base)
    expect(scripts()).toHaveLength(1)
    const data = JSON.parse(scripts()[0]!.textContent!)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(base.faq.length)
    const questions: string[] = data.mainEntity.map((q: { name: string }) => q.name)
    expect(questions).toEqual(base.faq.map((item) => item.question))
    for (const entity of data.mainEntity) {
      expect(entity['@type']).toBe('Question')
      expect(entity.acceptedAnswer['@type']).toBe('Answer')
      expect(entity.acceptedAnswer.text.length).toBeGreaterThan(0)
    }
    const faq = document.querySelector('[data-home-section="faq"]')!
    for (const question of questions) {
      expect(within(faq as HTMLElement).getByText(question)).toBeTruthy()
    }
  })

  it('emits no JSON-LD and no FAQ section when there are no questions', () => {
    renderHome({ ...base, faq: [] })
    expect(scripts()).toHaveLength(0)
    expect(sectionIds()).not.toContain('faq')
  })
})

describe('Home optional sections', () => {
  it('hides Selected work when there are no featured items (no empty heading)', () => {
    renderHome({ ...base, work: [] })
    expect(sectionIds()).not.toContain('selectedWork')
    expect(screen.queryByText(base.page.selectedWork.title)).toBeNull()
  })

  it('hides the blog when there are no posts (no empty heading)', () => {
    renderHome({ ...base, posts: [] })
    expect(sectionIds()).not.toContain('fromBlog')
    expect(screen.queryByText(base.page.fromBlog.title)).toBeNull()
  })

  it('hides Selected work when the page content toggle is off', () => {
    const m = withHome((page) => ({ selectedWork: { ...page.selectedWork, visible: false } }))
    renderHome(m)
    expect(sectionIds()).not.toContain('selectedWork')
  })

  it('hides the blog when the page content toggle is off', () => {
    renderHome(withHome((page) => ({ fromBlog: { ...page.fromBlog, visible: false } })))
    expect(sectionIds()).not.toContain('fromBlog')
  })

  it('hides Selected work when the site setting is off', () => {
    renderHome(withSettings(() => ({ showSelectedWork: false })))
    expect(sectionIds()).not.toContain('selectedWork')
  })

  it('renders at most three work cards, each linking to its detail page', () => {
    const work = Array.from({ length: 5 }, (_, i) => ({
      ...publicFixtures.work[0]!,
      slug: `item-${i}`,
      title: `Item ${i}`,
    }))
    renderHome({ ...base, work })
    const section = document.querySelector<HTMLElement>('[data-home-section="selectedWork"]')!
    const cards = section.querySelectorAll('[data-variant="work"]')
    expect(cards).toHaveLength(3)
    const hrefs = Array.from(cards).map((card) => card.querySelector('a')!.getAttribute('href'))
    expect(hrefs).toEqual(['/work/item-0', '/work/item-1', '/work/item-2'])
  })

  it('shows the internal demo badge on demo work, also on Home (FR-PF-03)', () => {
    renderHome({ ...base, work: [{ ...publicFixtures.work[0]!, projectType: 'internal-demo' }] })
    const section = document.querySelector<HTMLElement>('[data-home-section="selectedWork"]')!
    expect(within(section).getByText(labels.internalDemo)).toBeTruthy()
  })

  it('shows no demo badge on client work', () => {
    renderHome({ ...base, work: [{ ...publicFixtures.work[0]!, projectType: 'client' }] })
    expect(screen.queryByText(labels.internalDemo)).toBeNull()
  })

  it('renders a post card per post with link, category, date and reading time', () => {
    renderHome(base)
    const section = document.querySelector<HTMLElement>('[data-home-section="fromBlog"]')!
    const cards = section.querySelectorAll('[data-variant="post"]')
    expect(cards).toHaveLength(base.posts.length)
    base.posts.forEach((post, index) => {
      const card = cards[index] as HTMLElement
      expect(card.querySelector('a')!.getAttribute('href')).toBe(`/blog/${post.slug}`)
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(post.title)
      expect(card.querySelector('time')!.getAttribute('datetime')).toBe(post.publishedAt)
      if (post.category) expect(within(card).getByText(post.category.name)).toBeTruthy()
      expect(card.textContent).toContain(String(post.readingMinutes))
    })
  })

  it('renders a post without a cover or category', () => {
    renderHome({
      ...base,
      posts: [{ ...base.posts[0]!, cover: null, category: null }],
    })
    const card = document.querySelector<HTMLElement>('[data-variant="post"]')!
    expect(card.querySelector('img')).toBeNull()
    expect(within(card).getByRole('heading', { level: 3 })).toBeTruthy()
  })

  it('shows the Coming soon badge on the product path only while the product is not live', () => {
    const { unmount } = renderHome(base)
    expect(screen.getByText(labels.comingSoon)).toBeTruthy()
    unmount()
    renderHome({ ...base, productStatus: 'live' })
    expect(screen.queryByText(labels.comingSoon)).toBeNull()
  })

  it('renders without the optional UI labels', () => {
    render(<HomeView model={base} labels={{}} />)
    expect(screen.queryByText(labels.comingSoon)).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

describe('Home content sections', () => {
  it('renders every capability as a task card, every step and every audience card', () => {
    renderHome(base)
    const caps = document.querySelector<HTMLElement>('[data-home-section="capabilities"]')!
    for (const capability of base.capabilities) {
      expect(within(caps).getAllByText(capability.title).length).toBeGreaterThan(0)
    }
    const how = document.querySelector<HTMLElement>('[data-home-section="howWeWork"]')!
    for (const step of base.page.howWeWork.steps) {
      expect(within(how).getAllByText(step.title).length).toBeGreaterThan(0)
    }
    const who = document.querySelector<HTMLElement>('[data-home-section="whoWeHelp"]')!
    for (const card of base.page.whoWeHelp.cards) {
      expect(within(who).getByText(card.title)).toBeTruthy()
    }
  })

  it('renders Meet Sino as a header and a still, with no scroll scene yet', () => {
    renderHome(base)
    const meet = document.querySelector<HTMLElement>('[data-home-section="meetSino"]')!
    expect(within(meet).getByText(base.page.meetSino.body)).toBeTruthy()
    expect(meet.querySelector('[data-slot="sino-stage"]')).toBeTruthy()
  })

  it('draws Sino poses as decorative images (empty alt)', () => {
    renderHome(base)
    const paths = document.querySelector<HTMLElement>('[data-home-section="twoPaths"]')!
    const images = paths.querySelectorAll('img')
    expect(images.length).toBe(2)
    images.forEach((img) => expect(img.getAttribute('alt')).toBe(''))
  })
})

describe('Home sticky CTA bar', () => {
  const bar = () => document.querySelector('[data-slot="sticky-cta-bar"]')

  it('follows the site setting: rendered on mobile when enabled', () => {
    renderHome(withSettings(() => ({ enableStickyCtaBar: true })))
    expect(bar()).toBeTruthy()
  })

  it('is not rendered when the site setting is off', () => {
    renderHome(withSettings(() => ({ enableStickyCtaBar: false })))
    expect(bar()).toBeNull()
  })

  it('is not rendered without site settings', () => {
    renderHome({ ...base, settings: null })
    expect(bar()).toBeNull()
  })

  it('is not rendered on desktop widths', () => {
    stubMedia({ [DESKTOP]: true })
    renderHome(withSettings(() => ({ enableStickyCtaBar: true })))
    expect(bar()).toBeNull()
  })

  it('points at the hero CTA group and the final CTA, which exist on the page', () => {
    renderHome(withSettings(() => ({ enableStickyCtaBar: true })))
    expect(document.getElementById('hero-cta')).toBeTruthy()
    expect(document.getElementById('final-cta')).toBeTruthy()
  })

  it('links the primary action to the contact page and WhatsApp', () => {
    renderHome(
      withSettings(() => ({ enableStickyCtaBar: true })),
      { stickyPrimaryHref: '/contact' },
    )
    const nav = bar() as HTMLElement
    expect(
      within(nav).getByRole('link', { name: base.page.hero.primaryCtaLabel }).getAttribute('href'),
    ).toBe('/contact')
    expect(
      within(nav)
        .getByRole('link', { name: base.page.finalCta.whatsappCtaLabel })
        .getAttribute('href'),
    ).toContain('https://wa.me/')
  })

  it('names the landmark from the label, falling back to the primary CTA label', () => {
    const m = withSettings(() => ({ enableStickyCtaBar: true }))
    const { unmount } = renderHome(m)
    expect(bar()!.getAttribute('aria-label')).toBe(labels.stickyBarLabel)
    unmount()
    render(<HomeView model={m} labels={{}} />)
    expect(bar()!.getAttribute('aria-label')).toBe(base.page.hero.primaryCtaLabel)
  })
})
