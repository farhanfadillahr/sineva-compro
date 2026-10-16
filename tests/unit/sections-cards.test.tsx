import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AudienceCards } from '@/components/sections/audience-cards'
import { FinalCta } from '@/components/sections/final-cta'
import { TaskCardGrid } from '@/components/sections/task-card-grid'
import { TwoPaths } from '@/components/sections/two-paths'
import { publicFixtures } from '../fixtures/public'
import { criticalAxeViolations, image, stubMedia } from './sections-test-utils'

const home = publicFixtures.pages.home
const capabilities = publicFixtures.capabilities

beforeEach(() => stubMedia({}))

describe('TwoPaths', () => {
  const props = {
    product: {
      eyebrow: home.twoPaths.product.eyebrow,
      title: home.twoPaths.product.title,
      body: home.twoPaths.product.body,
      badge: 'Coming soon',
      cta: { label: home.twoPaths.product.ctaLabel, href: '/products/ai-agents' },
      image: image('Sino holding a phone'),
    },
    services: {
      eyebrow: home.twoPaths.services.eyebrow,
      title: home.twoPaths.services.title,
      body: home.twoPaths.services.body,
      cta: { label: home.twoPaths.services.ctaLabel, href: '/services' },
      image: image('Sino stacking building blocks'),
    },
    locale: 'en',
  }

  it('renders two path cards with title, body, CTA and pose image', () => {
    render(<TwoPaths {...props} />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual([
      home.twoPaths.product.title,
      home.twoPaths.services.title,
    ])
    expect(screen.getByText(home.twoPaths.product.body)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: home.twoPaths.product.ctaLabel }).getAttribute('href'),
    ).toBe('/products/ai-agents')
    expect(
      screen.getByRole('link', { name: home.twoPaths.services.ctaLabel }).getAttribute('href'),
    ).toBe('/services')
    expect(screen.getByAltText('Sino holding a phone')).toBeTruthy()
    expect(screen.getByText('Coming soon')).toBeTruthy()
  })

  it('tints Product and warms Services (components.md section 4)', () => {
    const { container } = render(<TwoPaths {...props} />)
    const cards = container.querySelectorAll('[data-variant="path"]')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.classList.contains('bg-surface-tint')).toBe(true)
    expect(cards[1]?.classList.contains('bg-surface-warm')).toBe(true)
  })

  it('emits the path_select analytics hook on each CTA', () => {
    render(<TwoPaths {...props} />)
    const product = screen.getByRole('link', { name: home.twoPaths.product.ctaLabel })
    const services = screen.getByRole('link', { name: home.twoPaths.services.ctaLabel })
    expect(product.getAttribute('data-umami-event')).toBe('path_select')
    expect(product.getAttribute('data-umami-event-path')).toBe('product')
    expect(product.getAttribute('data-umami-event-locale')).toBe('en')
    expect(services.getAttribute('data-umami-event-path')).toBe('services')
  })

  it('draws each pose through AnimatedPose, which owns the hover lift and its reduced-motion rule', () => {
    const { container } = render(<TwoPaths {...props} />)
    const slots = container.querySelectorAll<HTMLElement>('[data-slot="path-pose"]')
    expect(slots).toHaveLength(2)
    // The slot only positions the pose; the card (an article) is what AnimatedPose listens to.
    slots.forEach((slot) => {
      expect(slot.querySelector('[data-animated-pose]')).toBeTruthy()
      expect(slot.closest('article')).toBeTruthy()
    })
    // Neighbouring cards float out of phase and tilt in opposite directions.
    const poses = container.querySelectorAll<HTMLElement>('[data-animated-pose]')
    expect([...poses].map((p) => p.getAttribute('data-phase'))).toEqual(['0', '1'])
    expect([...poses].map((p) => p.style.getPropertyValue('--pose-tilt'))).toEqual(['1', '-1'])
  })

  it('renders without an image or badge', () => {
    render(
      <TwoPaths
        product={{ ...props.product, image: null, badge: undefined }}
        services={{ ...props.services, image: null }}
      />,
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<TwoPaths {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('TaskCardGrid', () => {
  const items = capabilities.map((c) => ({ ...c, image: image('Sino pose') }))
  const props = {
    title: home.capabilities.title,
    intro: home.capabilities.intro,
    items,
  }

  it('renders the section header and one card per capability, titled as a request', () => {
    render(<TaskCardGrid {...props} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(home.capabilities.title)
    const cards = screen.getAllByRole('heading', { level: 3 })
    expect(cards.map((h) => h.textContent)).toEqual(capabilities.map((c) => c.title))
    expect(cards[0]?.textContent).toMatch(/^Sino,/)
    expect(screen.getByText(capabilities[0]!.body)).toBeTruthy()
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<TaskCardGrid {...props} items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('tints each card from its capability tint and glows the featured one', () => {
    const { container } = render(<TaskCardGrid {...props} />)
    const cards = [...container.querySelectorAll<HTMLElement>('[data-variant="task"]')]
    expect(cards).toHaveLength(capabilities.length)
    const featuredIndex = capabilities.findIndex((c) => c.featured)
    cards.forEach((card, i) => {
      expect(card.classList.contains('shadow-glow')).toBe(i === featuredIndex)
    })
    expect(cards[0]?.getAttribute('data-tint')).toBe(capabilities[0]!.tint)
    expect(cards[1]?.getAttribute('data-tint')).toBe(capabilities[1]!.tint)
  })

  it('shows mockup lines as chat bubbles in a phone frame, alternating user and Sino', () => {
    const { container } = render(
      <TaskCardGrid {...props} items={[{ ...capabilities[0]!, image: null }]} />,
    )
    const phone = container.querySelector('[data-slot="phone-frame"]') as HTMLElement
    expect(phone.getAttribute('aria-hidden')).toBe('true')
    const bubbles = phone.querySelectorAll('[data-slot="chat-bubble"]')
    expect([...bubbles].map((b) => b.getAttribute('data-from'))).toEqual(['user', 'sino'])
    expect(bubbles[1]?.textContent).toBe(capabilities[0]!.mockupLines[1])
  })

  it('prefers the pose image over the phone mockup when an image is provided', () => {
    const { container } = render(
      <TaskCardGrid {...props} items={[{ ...capabilities[0]!, image: image('Sino pose') }]} />,
    )
    expect(container.querySelector('[data-slot="phone-frame"]')).toBeNull()
    expect(screen.getByAltText('Sino pose')).toBeTruthy()
  })

  it('reveals every card with the depth preset (staggered by arrival, see motion-reveal-variants)', () => {
    const { container } = render(<TaskCardGrid {...props} />)
    const wrappers = [...container.querySelectorAll<HTMLElement>('li[data-reveal]')]
    expect(wrappers.length).toBeGreaterThan(1)
    for (const w of wrappers) expect(w.getAttribute('data-reveal-variant')).toBe('depth')
  })

  it('lays the cards out as a bento on desktop with the featured card larger', () => {
    const { container } = render(<TaskCardGrid {...props} />)
    const list = container.querySelector('ul') as HTMLElement
    expect(list.className).toContain('lg:grid-cols-6')
    const featured = container.querySelector('[data-variant="task"].shadow-glow')
    expect(featured?.parentElement?.className).toContain('lg:col-span-4')
    expect(featured?.parentElement?.className).toContain('lg:row-span-2')
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<TaskCardGrid {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('AudienceCards', () => {
  const props = {
    title: home.whoWeHelp.title,
    items: home.whoWeHelp.cards,
    icons: { 'chat-bubble': <svg data-testid="icon-chat" aria-hidden="true" /> },
  }

  it('renders a header and one feature card per audience', () => {
    render(<AudienceCards {...props} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(home.whoWeHelp.title)
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(home.whoWeHelp.cards.map((c) => c.title))
    expect(screen.getByText(home.whoWeHelp.cards[0]!.body)).toBeTruthy()
  })

  it('renders the icon for a key when provided and skips it otherwise', () => {
    render(<AudienceCards {...props} />)
    expect(screen.getAllByTestId('icon-chat')).toHaveLength(
      home.whoWeHelp.cards.filter((c) => c.icon === 'chat-bubble').length,
    )
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<AudienceCards {...props} items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<AudienceCards {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('FinalCta', () => {
  const props = {
    headline: home.finalCta.headline,
    body: home.finalCta.body,
    primaryCta: { label: home.finalCta.primaryCtaLabel, href: '/contact' },
    secondaryCta: { label: home.finalCta.secondaryCtaLabel ?? '', href: '/products/ai-agents' },
    whatsappCta: { label: home.finalCta.whatsappCtaLabel, href: 'https://wa.me/6280000000000' },
    image: image('Sino waving'),
  }

  it('renders the headline, body and all three CTAs', () => {
    render(<FinalCta {...props} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(home.finalCta.headline)
    expect(screen.getByText(home.finalCta.body)).toBeTruthy()
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(
      screen.getByRole('link', { name: home.finalCta.whatsappCtaLabel }).getAttribute('href'),
    ).toBe('https://wa.me/6280000000000')
  })

  it('is an inverse rounded panel with the aurora wash, and the page has one of it', () => {
    const { container } = render(<FinalCta {...props} />)
    const panel = container.querySelector('[data-tone="inverse"]') as HTMLElement
    expect(panel).toBeTruthy()
    expect(panel.className).toContain('rounded-2xl')
    expect(panel.querySelector('[data-slot="cta-aurora"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('exposes an id the sticky bar can watch', () => {
    const { container } = render(<FinalCta {...props} />)
    expect(container.querySelector('#final-cta')).toBeTruthy()
    const { container: other } = render(<FinalCta {...props} id="cta-end" />)
    expect(other.querySelector('#cta-end')).toBeTruthy()
  })

  it('omits the optional CTAs and the pose', () => {
    render(<FinalCta headline="Ready" primaryCta={props.primaryCta} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<FinalCta {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('keeps links keyboard reachable with a visible focus ring', () => {
    render(<FinalCta {...props} />)
    expect(screen.getByRole('link', { name: home.finalCta.primaryCtaLabel }).className).toContain(
      'focus-visible:outline-focus',
    )
  })
})
