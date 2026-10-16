// Every public page applies the reveal on scroll (docs/design/motion.md 4.1). `Reveal` marks its
// element with `data-reveal`, so "renders inside Reveal" is `closest('[data-reveal]')`.
//
// Rules checked on every page:
// - each section below the hero has its heading and its list items (cards, steps) inside a Reveal;
// - the hero, and the h1 band of pages that have no hero, are NOT inside one: the hero has its own
//   entrance and the h1 is the LCP candidate, which a reveal must never delay.
// - each kind of element plays its own preset (motion.md 4.1): section headers `lines`, list cards
//   `depth`, the final CTA panel `rise-scale`, article pictures `clip`.
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AboutView } from '@/components/pages/about/about-view'
import { loadAboutModel } from '@/components/pages/about/about-model'
import { BlogListView } from '@/components/pages/blog/blog-list-view'
import { blogLabelsFromMessages } from '@/components/pages/blog/blog-labels'
import { loadBlogListModel, loadBlogPostModel } from '@/components/pages/blog/blog-model'
import { BlogPostView } from '@/components/pages/blog/blog-post-view'
import { loadContactModel, loadThankYouModel } from '@/components/pages/contact/contact-model'
import { ContactView } from '@/components/pages/contact/contact-view'
import { ThankYouView } from '@/components/pages/contact/thank-you-view'
import { HomeView } from '@/components/pages/home/home-view'
import { loadHomeModel } from '@/components/pages/home/home-model'
import { PrivacyView } from '@/components/pages/legal/privacy-view'
import { NotFoundView } from '@/components/pages/not-found/not-found-view'
import { ProductView } from '@/components/pages/product/product-view'
import { loadProductModel } from '@/components/pages/product/product-model'
import { productLabelsFromMessages } from '@/components/pages/product/product-labels'
import { ServiceDetailView } from '@/components/pages/services/service-detail-view'
import { ServicesListView } from '@/components/pages/services/services-list-view'
import {
  loadServiceDetailModel,
  loadServicesListModel,
} from '@/components/pages/services/services-model'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { createStaticContentSource } from '../../src/content/static'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import { publicFixtures } from '../fixtures/public'
import en from '../../messages/en.json'
import { installIntersectionObserver } from './motion-test-utils'
import { image, stubMedia } from './sections-test-utils'

const STATIC = createStaticContentSource()
const FIXTURE = createFixtureContentSource()
const SITE = new URL('https://sineva.example')

const intl = (ui: ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  )

const inReveal = (el: Element) => el.closest('[data-reveal]') !== null

/** Headings and list items that must reveal. Decorative (aria-hidden) items and nav lists are not content blocks. */
function revealTargets(root: Element, skip?: string) {
  const targets = Array.from(root.querySelectorAll('h2, h3, li')).filter((el) => {
    if (el.closest('[aria-hidden="true"]')) return false
    if (el.closest('nav, [role="tablist"]')) return false
    if (skip && el.closest(skip)) return false
    return true
  })
  return targets
}

function expectSectionsRevealed(
  attr: string,
  {
    heroId = 'hero',
    skip = {},
    skipIds = [],
  }: {
    heroId?: string
    skip?: Record<string, string>
    skipIds?: string[]
  } = {},
) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(`[${attr}]`))
  expect(sections.length).toBeGreaterThan(1)
  const seen: string[] = []
  for (const section of sections) {
    const id = section.getAttribute(attr)!
    if (id === heroId) {
      // The hero keeps its own entrance: its h1 is never inside a Reveal.
      const h1 = section.querySelector('h1')
      expect(h1, `${id} has an h1`).not.toBeNull()
      expect(inReveal(h1!), `${id} h1 must not be wrapped (LCP)`).toBe(false)
      continue
    }
    if (skipIds.includes(id)) continue
    seen.push(id)
    expect(
      section.querySelector('[data-reveal]'),
      `section "${id}" contains no Reveal`,
    ).not.toBeNull()
    for (const el of revealTargets(section, skip[id])) {
      expect(
        inReveal(el),
        `section "${id}": <${el.tagName.toLowerCase()}> "${(el.textContent ?? '').slice(0, 40)}" is not inside a Reveal`,
      ).toBe(true)
    }
  }
  expect(seen.length).toBeGreaterThan(0)
}

/**
 * The roles of motion.md 4.1, checked on whatever is rendered. A heading block that is not `lines`
 * would read as "ordinary" again, which is the regression this guards.
 */
function expectPresetRoles(root: ParentNode = document) {
  for (const title of root.querySelectorAll('[data-reveal-part="title"]')) {
    if (title.closest('[data-home-section="hero"], [data-about-section="hero"]')) continue
    // "Meet Sino" is built around its own scroll sequence and is edited by that work, not here.
    if (title.closest('[data-home-section="meetSino"], [data-about-section="meetSino"]')) continue
    if (title.tagName === 'H1') continue
    const owner = title.closest('[data-reveal]')
    expect(owner, `title "${title.textContent}" is inside a reveal`).not.toBeNull()
    expect(owner!.getAttribute('data-reveal-variant'), `title "${title.textContent}"`).toBe('lines')
  }
  for (const li of root.querySelectorAll('li[data-reveal]')) {
    expect(
      li.getAttribute('data-reveal-variant'),
      `card ${(li.textContent ?? '').slice(0, 30)}`,
    ).toBe('depth')
  }
  for (const panel of root.querySelectorAll('[data-tone="inverse"][data-reveal]')) {
    expect(panel.getAttribute('data-reveal-variant'), 'final CTA panel').toBe('rise-scale')
  }
}

beforeEach(() => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('scroll reveal on every public page', () => {
  it('Home', async () => {
    const loaded = (await loadHomeModel(FIXTURE, 'en'))!
    const model = {
      ...loaded,
      page: { ...loaded.page, hero: { ...loaded.page.hero, poster: image('Sino waving') } },
      work: publicFixtures.work.filter((item) => item.featured),
      posts: publicFixtures.posts.slice(0, 3),
    }
    render(
      <HomeView
        model={model}
        labels={{ stickyBarLabel: 'Next', comingSoon: 'Soon', internalDemo: 'Demo' }}
      />,
    )
    expectSectionsRevealed('data-home-section')
    expectPresetRoles()
  })

  it('Services list', async () => {
    const model = (await loadServicesListModel(FIXTURE, 'en'))!
    render(<ServicesListView model={model} labels={servicesLabelsFromMessages(en)} />)
    expectSectionsRevealed('data-services-section')
    expectPresetRoles()
  })

  for (const slug of ['ai-discovery', 'ai-build', 'ai-enablement']) {
    it(`Service detail: ${slug}`, async () => {
      const model = (await loadServiceDetailModel(FIXTURE, slug, 'en'))!
      render(<ServiceDetailView model={model} labels={servicesLabelsFromMessages(en)} />)
      expectSectionsRevealed('data-services-section')
      expectPresetRoles()
    })
  }

  it('Product (ai-agents)', async () => {
    const model = (await loadProductModel(FIXTURE, 'en'))!
    render(<ProductView model={model} labels={productLabelsFromMessages(en)} />)
    // "How it works" is a sticky scroll story: only its heading reveals, the story itself must
    // stay un-transformed so `position: sticky` keeps working.
    expectSectionsRevealed('data-product-section', {
      skip: { howItWorks: '[data-slot="sticky-steps"]' },
    })
    expectPresetRoles()
  })

  it('About', async () => {
    const loaded = (await loadAboutModel(FIXTURE, 'en'))!
    const model = {
      ...loaded,
      page: {
        ...loaded.page,
        hero: { ...loaded.page.hero, scene: image('Sino and two colleagues', 1600, 1200) },
        team: { ...loaded.page.team, visible: true },
      },
      settings: { ...loaded.settings!, features: { ...loaded.settings!.features, showTeam: true } },
      team: publicFixtures.team.map((member) => ({
        ...member,
        photo: member.photo ? image(member.photo.alt, 800, 800) : null,
      })),
    }
    render(<AboutView model={model} labels={{ chatOnWhatsapp: 'Chat' }} />)
    expectSectionsRevealed('data-about-section')
    expectPresetRoles()
  })

  describe('Blog list', () => {
    it('reveals the featured card, every grid card and the pagination; the h1 band is not wrapped', async () => {
      const { many, sourceOf } = await import('./blog-test-utils')
      const model = (await loadBlogListModel(sourceOf(many(20)), 'en', {}))!
      const { container } = render(
        <BlogListView model={model} labels={blogLabelsFromMessages(en)} />,
      )
      const header = container.querySelector('[data-blog-section="header"]')!
      expect(inReveal(header.querySelector('h1')!)).toBe(false)
      const featured = container.querySelector('[data-blog-featured]')!
      expect(inReveal(featured)).toBe(true)
      const cards = Array.from(container.querySelectorAll('[data-blog-grid] > li'))
      expect(cards.length).toBeGreaterThan(1)
      for (const card of cards) expect(inReveal(card)).toBe(true)
      expectPresetRoles(container)
      expect(featured.closest('[data-reveal]')?.getAttribute('data-reveal-variant')).toBe('depth')
      const paging = container.querySelector(
        `nav[aria-label="${blogLabelsFromMessages(en).paginationLabel}"]`,
      )
      expect(paging, 'pagination renders for 20 posts').not.toBeNull()
      expect(inReveal(paging!)).toBe(true)
    })

    it('reveals the empty state', async () => {
      const { sourceOf } = await import('./blog-test-utils')
      const model = (await loadBlogListModel(sourceOf([]), 'en', {}))!
      const { container } = render(
        <BlogListView model={model} labels={blogLabelsFromMessages(en)} />,
      )
      expect(inReveal(container.querySelector('[data-blog-empty]')!)).toBe(true)
    })
  })

  it('Blog article', async () => {
    const model = (await loadBlogPostModel(
      STATIC,
      'where-to-start-with-ai-in-a-small-business',
      'en',
    ))!
    const { container } = render(
      <BlogPostView model={model} labels={blogLabelsFromMessages(en)} siteUrl={SITE} />,
    )
    // Header band (h1, cover) is the LCP area: no reveal there.
    const header = container.querySelector('[data-blog-header]')!
    expect(inReveal(header.querySelector('h1')!)).toBe(false)
    // The body is long: it reveals block by block, never as one tall element (an observer cannot
    // reach its 15% threshold on a block taller than ~6 viewports).
    const body = container.querySelector('[data-blog-body]')!
    const text = body.querySelector(':scope > div:first-child')!
    const blocks = Array.from(text.children)
    expect(blocks.length).toBeGreaterThan(2)
    for (const block of blocks) expect(inReveal(block), block.outerHTML.slice(0, 60)).toBe(true)
    expect(text.querySelectorAll(':scope > [data-reveal]').length).toBe(blocks.length)
    // Share row, related cards, closing CTA.
    expect(inReveal(container.querySelector('#article-share')!)).toBe(true)
    const related = container.querySelector('[data-blog-related]')!
    expect(inReveal(related.querySelector('h2')!)).toBe(true)
    for (const li of related.querySelectorAll('ul > li')) expect(inReveal(li)).toBe(true)
    const cta = container.querySelector('[data-tone="inverse"]')!
    expect(inReveal(cta)).toBe(true)
    expectPresetRoles(container)
  })

  it('Contact: steps, side card and form card reveal; the h1 header does not', async () => {
    const model = (await loadContactModel(STATIC, 'en'))!
    const { container } = intl(<ContactView model={model} form={<div>form</div>} />)
    expect(inReveal(container.querySelector('h1')!)).toBe(false)
    const steps = Array.from(container.querySelectorAll('[data-variant="step"]'))
    expect(steps).toHaveLength(3)
    for (const step of steps) expect(inReveal(step)).toBe(true)
    expectPresetRoles(container)
    expect(inReveal(container.querySelector('[data-slot="form-card"]')!)).toBe(true)
    const side = container.querySelector('h2')
    expect(side && inReveal(side), 'the WhatsApp / details card').toBe(true)
  })

  it('Contact thank-you: the keep-exploring block reveals; Sino and the h1 do not', async () => {
    const model = (await loadThankYouModel(STATIC, 'en'))!
    const { container } = intl(<ThankYouView model={model} />)
    expect(inReveal(container.querySelector('h1')!)).toBe(false)
    expect(inReveal(container.querySelector('nav[aria-labelledby="thank-you-more"]')!)).toBe(true)
  })

  it('Privacy policy: the text reveals block by block; title and contents do not', async () => {
    const page = (await STATIC.getPage('privacy', 'en'))!
    const { container } = intl(<PrivacyView page={page} />)
    expect(inReveal(container.querySelector('h1')!)).toBe(false)
    const article = container.querySelector('article')!
    const blocks = Array.from(article.querySelectorAll(':scope > div > *'))
    expect(blocks.length).toBeGreaterThan(3)
    for (const block of blocks) expect(inReveal(block), block.outerHTML.slice(0, 60)).toBe(true)
    expect(article.querySelectorAll(':scope > div > [data-reveal]').length).toBe(blocks.length)
    // The sticky contents must not sit inside a (transformed) reveal.
    const toc = container.querySelector('nav')!
    expect(inReveal(toc)).toBe(false)
  })

  it('404: the links reveal; Sino and the h1 do not', async () => {
    const page = (await STATIC.getPage('notFound', 'en'))!
    const { container } = intl(<NotFoundView page={page} />)
    expect(inReveal(container.querySelector('h1')!)).toBe(false)
    expect(inReveal(container.querySelector('nav')!)).toBe(true)
  })
})
