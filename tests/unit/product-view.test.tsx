import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadProductModel,
  planProductSections,
  type ProductModel,
} from '@/components/pages/product/product-model'
import { productLabelsFromMessages } from '@/components/pages/product/product-labels'
import { ProductView, type ProductViewProps } from '@/components/pages/product/product-view'
import { createStaticContentSource } from '../../src/content/static'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import en from '../../messages/en.json'
import { installIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, DESKTOP, stubMedia } from './sections-test-utils'

const labels = productLabelsFromMessages(en)

let base: ProductModel

function withSettings(
  patch: (settings: NonNullable<ProductModel['settings']>) => object,
): ProductModel {
  const settings = base.settings!
  return { ...base, settings: { ...settings, ...patch(settings) } as typeof settings }
}

function renderProduct(m: ProductModel, props: Partial<ProductViewProps> = {}) {
  return render(<ProductView model={m} labels={labels} {...props} />)
}

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-product-section]'))
const sectionIds = () => sections().map((el) => el.dataset.productSection)
const section = (id: string) =>
  document.querySelector<HTMLElement>(`[data-product-section="${id}"]`)!

beforeEach(async () => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  base = (await loadProductModel(createFixtureContentSource(), 'en'))!
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Product composition', () => {
  it('renders the sections in the order of page-patterns 2.2, without the comparison', () => {
    renderProduct(base)
    expect(sectionIds()).toEqual([
      'hero',
      'capabilities',
      'howItWorks',
      'madeForYou',
      'control',
      'faq',
      'finalCta',
    ])
  })

  it('does not render the comparison even when the content switches it on', () => {
    renderProduct({
      ...base,
      page: {
        ...base.page,
        comparison: {
          visible: true,
          title: 'Ways of working',
          columns: ['Doing it manually', 'Sineva AI Agents'],
          rows: [{ label: 'Speed', cells: ['x', 'y'] }],
        },
      },
    })
    expect(screen.queryByText('Ways of working')).toBeNull()
    expect(document.querySelector('table')).toBeNull()
  })

  it('renders exactly the plan: view and plan cannot drift apart', () => {
    renderProduct(base)
    expect(sectionIds()).toEqual(planProductSections(base).map((s) => s.id))
  })

  it('puts the planned tone on each section band', () => {
    renderProduct(base)
    const plan = planProductSections(base)
    sections().forEach((wrapper, index) => {
      const planned = plan[index]!
      expect(wrapper.dataset.productTone).toBe(planned.tone)
      if (planned.id === 'finalCta') {
        // The band is canvas; the rounded panel inside it is the one inverse surface.
        expect(wrapper.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
      } else {
        expect(wrapper.querySelector('section')?.getAttribute('data-tone')).toBe(planned.tone)
      }
    })
    expect(document.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('wraps everything in one focusable main landmark with the skip-link id', () => {
    renderProduct(base)
    const mains = document.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe('main-content')
    expect(mains[0]!.getAttribute('tabindex')).toBe('-1')
  })

  it('has exactly one h1, the hero headline, and no skipped heading level', () => {
    renderProduct(base)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.textContent).toBe(base.page.hero.headline)
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName[1]))
    levels.reduce((previous, level) => {
      expect(level - previous).toBeLessThanOrEqual(1)
      return level
    }, 0)
  })

  it('titles every section with its heading from the page content', () => {
    renderProduct(base)
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual(
      expect.arrayContaining([
        base.page.capabilities.title,
        base.page.howItWorks.title,
        base.page.madeForYou.title,
        base.page.control.title,
        base.page.faq.title,
        base.page.finalCta.headline,
      ]),
    )
  })

  it('has no duplicate ids inside the page', () => {
    renderProduct(base)
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no critical or serious accessibility violations', async () => {
    const { container } = renderProduct(base)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('Product hero', () => {
  it('uses the mockup variant with the chat bubbles and floating chips of the content', () => {
    renderProduct(base)
    const hero = section('hero')
    expect(hero.querySelector('section')?.getAttribute('data-variant')).toBe('mockup')
    const bubbles = hero.querySelectorAll('[data-slot="chat-bubble"]')
    expect(bubbles).toHaveLength(base.page.hero.mockup.bubbles.length)
    base.page.hero.mockup.bubbles.forEach((bubble, index) => {
      expect(bubbles[index]!.textContent).toBe(bubble.text)
      expect(bubbles[index]!.getAttribute('data-from')).toBe(bubble.from)
    })
    const chips = Array.from(hero.querySelectorAll('[data-slot="ui-chip"]')).map(
      (el) => el.textContent,
    )
    expect(chips).toEqual(base.page.hero.mockup.chips)
  })

  it('shows the eyebrow, lead and waitlist intro from the content, and the Coming soon label', () => {
    renderProduct(base)
    const hero = section('hero')
    expect(within(hero).getByText(base.page.hero.lead)).toBeTruthy()
    expect(within(hero).getByText(base.page.hero.eyebrow!)).toBeTruthy()
    expect(within(hero).getByText(base.page.hero.waitlistIntro)).toBeTruthy()
    expect(within(hero).getByText(labels.comingSoon)).toBeTruthy()
  })

  it('has the inline waitlist form behind the #waitlist anchor, inside the hero', () => {
    renderProduct(base)
    const anchor = document.getElementById('waitlist')!
    expect(anchor).toBeTruthy()
    expect(section('hero').contains(anchor)).toBe(true)
    expect(within(anchor).getByRole('form')).toBeTruthy()
    expect(
      within(anchor).getByRole('button', { name: base.page.hero.primaryCtaLabel }),
    ).toBeTruthy()
    // Clear of the sticky header (72 px) when the anchor is the scroll target.
    expect(anchor.className).toMatch(/scroll-mt-/)
  })

  it('builds the WhatsApp link from the product template of the settings', async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    vi.stubGlobal('open', open)
    renderProduct(base)
    const anchor = document.getElementById('waitlist')!
    await user.click(within(anchor).getByRole('checkbox'))
    await user.click(within(anchor).getByRole('button', { name: base.page.hero.primaryCtaLabel }))
    const url = open.mock.calls[0]![0] as string
    const digits = base.settings!.whatsapp.number.replace(/\D/g, '')
    expect(url.startsWith(`https://wa.me/${digits}?text=`)).toBe(true)
    expect(decodeURIComponent(url.split('?text=')[1]!)).toContain(
      base.settings!.whatsapp.templates.product,
    )
  })

  it('offers the business types of the content as the form options', () => {
    renderProduct(base)
    const select = within(document.getElementById('waitlist')!).getByRole('combobox')
    expect(
      within(select)
        .getAllByRole('option')
        .slice(1)
        .map((o) => o.textContent),
    ).toEqual(base.industries.map((industry) => industry.label))
  })

  it('keeps the waitlist form as the only hero action while coming soon', () => {
    renderProduct(base)
    // Two primary actions in one hero split attention; the consultation lives in the final CTA.
    const form = document.getElementById('waitlist')
    const actionLinks = within(section('hero'))
      .queryAllByRole('link')
      .filter((link) => !form?.contains(link))
    expect(actionLinks).toHaveLength(0)
  })

  it('exposes the hero CTA group id the sticky bar observes', () => {
    renderProduct(base)
    expect(document.getElementById('hero-cta')).toBeTruthy()
  })

  it('renders no form, and no dead action, when there are no site settings', () => {
    renderProduct({ ...base, settings: null })
    expect(document.getElementById('waitlist')).toBeNull()
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('has no email button while the settings hold no public email', async () => {
    const model = (await loadProductModel(createStaticContentSource(), 'en'))!
    renderProduct(model)
    expect(screen.queryByRole('button', { name: labels.waitlist.emailButton })).toBeNull()
  })

  it('offers the email route once the settings hold a public email', () => {
    renderProduct(base)
    expect(screen.getByRole('button', { name: labels.waitlist.emailButton })).toBeTruthy()
  })

  it('does not post to the server: there is exactly one form and it has no action', () => {
    renderProduct(base)
    const forms = document.querySelectorAll('form')
    expect(forms).toHaveLength(1)
    expect(forms[0]!.hasAttribute('action')).toBe(false)
  })

  it('points the consent link at the privacy page it is given', () => {
    renderProduct(base, { privacyHref: '/kebijakan-privasi' })
    expect(
      within(document.getElementById('waitlist')!)
        .getByRole('link', { name: labels.waitlist.consentLink })
        .getAttribute('href'),
    ).toBe('/kebijakan-privasi')
  })
})

describe('Product when live', () => {
  const live = () => ({ ...base, productStatus: 'live' as const })

  it('replaces the form and the Coming soon label with the Try action, from the data', () => {
    renderProduct(live())
    expect(document.getElementById('waitlist')).toBeNull()
    expect(screen.queryByRole('form')).toBeNull()
    expect(screen.queryByText(labels.comingSoon)).toBeNull()
    const cta = within(section('hero')).getByRole('link', { name: base.page.hero.primaryCtaLabel })
    expect(cta.getAttribute('href')!.startsWith('https://wa.me/')).toBe(true)
  })

  it('sends the final CTA primary action to the same target instead of the waitlist', () => {
    renderProduct(live())
    const cta = within(section('finalCta')).getByRole('link', {
      name: base.page.finalCta.primaryCtaLabel,
    })
    expect(cta.getAttribute('href')).not.toContain('#waitlist')
  })
})

describe('Product capabilities, steps, tabs and control', () => {
  it('renders one task card per capability, each with its request on a decorative phone mockup', () => {
    renderProduct(base)
    const caps = section('capabilities')
    const cards = caps.querySelectorAll('[data-variant="task"]')
    expect(cards).toHaveLength(base.capabilities.length)
    base.capabilities.forEach((capability, index) => {
      const card = cards[index] as HTMLElement
      expect(within(card).getByRole('heading', { name: capability.title })).toBeTruthy()
      expect(within(card).getByText(capability.body)).toBeTruthy()
      const phone = card.querySelector('[data-slot="phone-frame"]') as HTMLElement
      expect(phone.getAttribute('aria-hidden')).toBe('true')
      expect(phone.querySelector('img')).toBeNull()
      expect(within(phone).getByText('Online')).toBeTruthy()
    })
  })

  it('renders the four steps with a phone screen made of the content chat lines', () => {
    renderProduct(base)
    const how = section('howItWorks')
    for (const step of base.page.howItWorks.steps) {
      expect(within(how).getAllByText(step.title).length).toBeGreaterThan(0)
    }
    const bubbles = how.querySelectorAll('[data-slot="chat-bubble"]')
    expect(bubbles.length).toBeGreaterThan(0)
    const allowed = new Set(base.page.hero.mockup.bubbles.map((b) => b.text))
    bubbles.forEach((bubble) => expect(allowed.has(bubble.textContent ?? '')).toBe(true))
  })

  it('renders the business type tabs from the industries, one panel visible', () => {
    renderProduct(base)
    const made = section('madeForYou')
    const tablist = within(made).getByRole('tablist', { name: labels.tabsLabel })
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(base.industries.map((industry) => industry.label))
    expect(within(made).getByRole('tabpanel').textContent).toContain(base.industries[0]!.exampleDay)
  })

  it('renders the control features as feature cards', () => {
    renderProduct(base)
    const cards = section('control').querySelectorAll('[data-variant="feature"]')
    expect(cards).toHaveLength(base.page.control.features.length)
    base.page.control.features.forEach((feature, index) => {
      const card = cards[index] as HTMLElement
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(feature.title)
      expect(within(card).getByText(feature.body)).toBeTruthy()
    })
  })
})

describe('Product FAQ JSON-LD', () => {
  const scripts = () =>
    Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))

  it('emits one valid FAQPage that matches the visible questions', () => {
    renderProduct(base)
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
    for (const question of questions) {
      expect(within(section('faq')).getByText(question)).toBeTruthy()
    }
  })

  it('does not break out of the script tag when an answer holds markup', () => {
    renderProduct({
      ...base,
      faq: [
        {
          question: 'Q?',
          answer: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: '</script><b>x</b>' }] },
            ],
          },
        },
      ],
    })
    expect(scripts()).toHaveLength(1)
    expect(scripts()[0]!.textContent).not.toContain('</script>')
    expect(() => JSON.parse(scripts()[0]!.textContent!)).not.toThrow()
  })

  it('emits no JSON-LD and no FAQ section when there are no questions', () => {
    renderProduct({ ...base, faq: [] })
    expect(scripts()).toHaveLength(0)
    expect(sectionIds()).not.toContain('faq')
  })
})

describe('Product final CTA', () => {
  const link = (name: string) => within(section('finalCta')).getByRole('link', { name })

  it('offers Get notified (back to the waitlist) and Book a free consultation', () => {
    renderProduct(base)
    const final = base.page.finalCta
    expect(link(final.primaryCtaLabel).getAttribute('href')).toBe('/products/ai-agents#waitlist')
    expect(link(final.secondaryCtaLabel!).getAttribute('href')).toBe('/contact')
  })

  it('omits the consultation CTA when the content has no label for it', () => {
    renderProduct({
      ...base,
      page: { ...base.page, finalCta: { ...base.page.finalCta, secondaryCtaLabel: null } },
    })
    expect(
      within(section('finalCta')).queryByRole('link', { name: base.page.finalCta.primaryCtaLabel }),
    ).toBeTruthy()
    expect(within(section('finalCta')).getAllByRole('link')).toHaveLength(1)
  })

  it('uses the link component it is given for internal links', () => {
    const Marked = ({ href, children, ...rest }: { href: never; children?: ReactNode }) => (
      <a data-localised="yes" href={href as string} {...rest}>
        {children}
      </a>
    )
    renderProduct(base, { linkComponent: Marked as never })
    expect(link(base.page.finalCta.secondaryCtaLabel!).dataset.localised).toBe('yes')
  })
})

describe('Product sticky CTA bar', () => {
  const bar = () => document.querySelector('[data-slot="sticky-cta-bar"]')

  it('follows the site setting: rendered on mobile when enabled, absent when off', () => {
    const { unmount } = renderProduct(
      withSettings((s) => ({ features: { ...s.features, enableStickyCtaBar: true } })),
    )
    expect(bar()).toBeTruthy()
    unmount()
    renderProduct(withSettings((s) => ({ features: { ...s.features, enableStickyCtaBar: false } })))
    expect(bar()).toBeNull()
  })

  it('is not rendered on desktop widths', () => {
    stubMedia({ [DESKTOP]: true })
    renderProduct(withSettings((s) => ({ features: { ...s.features, enableStickyCtaBar: true } })))
    expect(bar()).toBeNull()
  })

  it('takes the visitor to the waitlist form, and observes ids that exist on the page', () => {
    renderProduct(
      withSettings((s) => ({ features: { ...s.features, enableStickyCtaBar: true } })),
      { stickyPrimaryHref: '#waitlist' },
    )
    const nav = bar() as HTMLElement
    expect(
      within(nav).getByRole('link', { name: base.page.hero.primaryCtaLabel }).getAttribute('href'),
    ).toBe('#waitlist')
    expect(nav.getAttribute('aria-label')).toBe(labels.stickyBarLabel)
    expect(document.getElementById('hero-cta')).toBeTruthy()
    expect(document.getElementById('final-cta')).toBeTruthy()
  })
})
