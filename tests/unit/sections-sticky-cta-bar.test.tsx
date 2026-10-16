import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StickyCtaBar } from '@/components/sections/sticky-cta-bar'
import { publicFixtures } from '../fixtures/public'
import { installIntersectionObserver, MockIntersectionObserver as IO } from './motion-test-utils'
import { criticalAxeViolations, DESKTOP, REDUCED, stubMedia } from './sections-test-utils'

const home = publicFixtures.pages.home
const settings = publicFixtures.siteSettings

const props = {
  label: 'Next steps',
  primaryCta: { label: home.hero.primaryCtaLabel, href: '/contact' },
  whatsappCta: { label: home.finalCta.whatsappCtaLabel, href: 'https://wa.me/6280000000000' },
  heroTargetId: 'hero-cta',
  endTargetId: 'final-cta',
}

// The bar watches two elements that live elsewhere on the page.
function Page(extra: Partial<typeof props & { enabled: boolean }> = {}) {
  return (
    <>
      <div id="hero-cta">hero</div>
      <StickyCtaBar {...props} {...extra} />
      <div id="final-cta">final</div>
    </>
  )
}

const bar = () => document.querySelector('[data-slot="sticky-cta-bar"]') as HTMLElement | null
const hero = () => document.getElementById('hero-cta') as HTMLElement
const final = () => document.getElementById('final-cta') as HTMLElement

// A hero that has scrolled out of view above the viewport vs one still below the fold.
const leftAbove = { isIntersecting: false, boundingClientRect: { top: -120 } as DOMRect }
const stillBelow = { isIntersecting: false, boundingClientRect: { top: 900 } as DOMRect }
const inView = { isIntersecting: true, boundingClientRect: { top: 100 } as DOMRect }

beforeEach(() => {
  installIntersectionObserver()
  stubMedia({})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StickyCtaBar rendering rules', () => {
  it('uses the site setting: nothing rendered when enable sticky CTA bar is off', () => {
    expect(settings.features.enableStickyCtaBar).toBeTypeOf('boolean')
    render(<Page enabled={false} />)
    expect(bar()).toBeNull()
  })

  it('is mobile only: not rendered on desktop widths', () => {
    stubMedia({ [DESKTOP]: true })
    render(<Page />)
    expect(bar()).toBeNull()
  })

  it('renders nothing in the server HTML (it only exists after the client knows the width)', () => {
    expect(renderToString(<Page />)).not.toContain('sticky-cta-bar')
  })

  it('is mounted but hidden and inert until the hero CTA has scrolled away', () => {
    render(<Page />)
    expect(bar()).toBeTruthy()
    expect(bar()!.getAttribute('data-visible')).toBe('false')
    expect(bar()!.hasAttribute('inert')).toBe(true)
  })

  it('renders the primary and WhatsApp CTAs as links inside a labelled nav', () => {
    render(<Page />)
    const nav = bar() as HTMLElement
    expect(nav.tagName).toBe('NAV')
    expect(nav.getAttribute('aria-label')).toBe('Next steps')
    expect(
      screen
        .getByRole('link', { name: home.hero.primaryCtaLabel, hidden: true })
        .getAttribute('href'),
    ).toBe('/contact')
    expect(
      screen
        .getByRole('link', { name: home.finalCta.whatsappCtaLabel, hidden: true })
        .getAttribute('href'),
    ).toBe('https://wa.me/6280000000000')
  })

  it('omits the WhatsApp CTA when not given', () => {
    render(<Page whatsappCta={undefined} />)
    expect(screen.getAllByRole('link', { hidden: true })).toHaveLength(1)
  })
})

describe('StickyCtaBar visibility logic (IntersectionObserver mocked)', () => {
  const fire = (el: Element, entry: Parameters<typeof IO.fire>[1]) => act(() => IO.fire(el, entry))

  it('shows once the hero CTA has left the viewport upwards', () => {
    render(<Page />)
    fire(hero(), leftAbove)
    expect(bar()!.getAttribute('data-visible')).toBe('true')
    expect(bar()!.hasAttribute('inert')).toBe(false)
  })

  it('stays hidden while the hero CTA is merely below the fold', () => {
    render(<Page />)
    fire(hero(), stillBelow)
    expect(bar()!.getAttribute('data-visible')).toBe('false')
  })

  it('hides again when the hero CTA is back in view', () => {
    render(<Page />)
    fire(hero(), leftAbove)
    fire(hero(), inView)
    expect(bar()!.getAttribute('data-visible')).toBe('false')
  })

  it('hides while the final CTA is visible and returns when it leaves', () => {
    render(<Page />)
    fire(hero(), leftAbove)
    fire(final(), inView)
    expect(bar()!.getAttribute('data-visible')).toBe('false')
    fire(final(), { isIntersecting: false, boundingClientRect: { top: 900 } as DOMRect })
    expect(bar()!.getAttribute('data-visible')).toBe('true')
  })

  it('does not show for the final CTA alone (hero not yet scrolled past)', () => {
    render(<Page />)
    fire(final(), { isIntersecting: false, boundingClientRect: { top: 2000 } as DOMRect })
    expect(bar()!.getAttribute('data-visible')).toBe('false')
  })

  it('stays hidden and does not throw when a target element is missing', () => {
    render(<StickyCtaBar {...props} heroTargetId="nope" endTargetId="nada" />)
    expect(bar()!.getAttribute('data-visible')).toBe('false')
  })

  it('disconnects its observers on unmount', () => {
    const { unmount } = render(<Page />)
    expect(IO.liveObserverCount()).toBeGreaterThan(0)
    unmount()
    expect(IO.liveObserverCount()).toBe(0)
  })
})

describe('StickyCtaBar motion and accessibility', () => {
  it('has no critical or serious axe violations', async () => {
    const { container } = render(<Page />)
    act(() => IO.fire(hero(), leftAbove))
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('does not slide under reduced motion (the transition is gated in CSS, the flag is on the bar)', () => {
    stubMedia({ [REDUCED]: true })
    render(<Page />)
    expect(bar()!.className).toContain('motion-reduce:transition-none')
  })

  it('keeps the CTAs at least 44 px tall', () => {
    render(<Page />)
    const link = screen.getAllByRole('link', { hidden: true })[0] as HTMLElement
    expect(link.getAttribute('data-size')).not.toBe('sm')
  })
})
