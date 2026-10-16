import { act, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroSplit } from '@/components/sections/hero-split'
import { SinoStage } from '@/components/sections/_internal/sino-stage'
import { publicFixtures } from '../fixtures/public'
import { criticalAxeViolations, image, REDUCED, stubMedia } from './sections-test-utils'

const home = publicFixtures.pages.home
const product = publicFixtures.pages.product

const baseProps = {
  eyebrow: home.hero.eyebrow,
  headline: home.hero.headline,
  lead: home.hero.lead,
  primaryCta: { label: home.hero.primaryCtaLabel, href: '/contact' },
  secondaryCta: { label: home.hero.secondaryCtaLabel ?? '', href: '/products/ai-agents' },
}

let frames: FrameRequestCallback[] = []

beforeEach(() => {
  stubMedia({})
  frames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HeroSplit content', () => {
  it('renders eyebrow, an h1, the lead and both CTAs from props', () => {
    render(<HeroSplit {...baseProps} variant="sino-still" image={image('Sino waving')} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(home.hero.headline)
    expect(screen.getByText(home.hero.eyebrow ?? '')).toBeTruthy()
    expect(screen.getByText(home.hero.lead)).toBeTruthy()
    const primary = screen.getByRole('link', { name: home.hero.primaryCtaLabel })
    expect(primary.getAttribute('href')).toBe('/contact')
    const secondary = screen.getByRole('link', { name: home.hero.secondaryCtaLabel ?? '' })
    expect(secondary.getAttribute('href')).toBe('/products/ai-agents')
  })

  it('can render the headline as an h2 for pages that already have an h1 (gallery)', () => {
    render(<HeroSplit {...baseProps} headingAs="h2" variant="sino-still" image={image('Sino')} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(home.hero.headline)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('keeps the hero headline within ten words (copywriting.md section 9)', () => {
    expect(home.hero.headline.split(/\s+/).length).toBeLessThanOrEqual(10)
    expect(product.hero.headline.split(/\s+/).length).toBeLessThanOrEqual(10)
  })

  it('omits the eyebrow and the secondary CTA when they are null', () => {
    render(
      <HeroSplit
        {...baseProps}
        eyebrow={null}
        secondaryCta={null}
        variant="sino-still"
        image={image('Sino')}
      />,
    )
    expect(screen.queryByText(home.hero.eyebrow ?? '')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('accepts explicit headline lines and staggers them 60 ms apart', () => {
    render(
      <HeroSplit
        {...baseProps}
        headline={['Your AI team for everyday work.', 'Ready when you are.']}
        variant="sino-still"
        image={image('Sino')}
      />,
    )
    const h1 = screen.getByRole('heading', { level: 1 })
    const lines = h1.querySelectorAll('[data-hero-delay]')
    expect([...lines].map((l) => l.getAttribute('data-hero-delay'))).toEqual(['0', '60'])
  })

  it('puts the CTA group in the DOM with an id the sticky bar can observe', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    const group = container.querySelector('#hero-cta')
    expect(group).toBeTruthy()
    expect(within(group as HTMLElement).getAllByRole('link')).toHaveLength(2)
  })

  it('supports a custom CTA group id and an extra slot under the CTAs', () => {
    const { container } = render(
      <HeroSplit
        {...baseProps}
        ctaId="product-hero-cta"
        extra={<form aria-label="Waitlist" data-testid="extra" />}
        variant="sino-still"
        image={image('Sino')}
      />,
    )
    expect(container.querySelector('#product-hero-cta')).toBeTruthy()
    expect(screen.getByTestId('extra')).toBeTruthy()
  })

  it('renders the text column before the visual column in the DOM', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino waving')} />,
    )
    const h1 = container.querySelector('h1') as HTMLElement
    const img = container.querySelector('img') as HTMLElement
    expect(h1.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('uses the aurora tone for the band', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    expect(container.querySelector('section')?.getAttribute('data-tone')).toBe('aurora')
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino waving')} />,
    )
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('HeroSplit variants', () => {
  it('sino-still: a Sino image on a stage', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino waving')} />,
    )
    expect(container.querySelector('[data-variant="sino-still"]')).toBeTruthy()
    const stage = container.querySelector('[data-slot="sino-stage"]') as HTMLElement
    expect(within(stage).getByAltText('Sino waving')).toBeTruthy()
  })

  it('sino-canvas: reserves a canvas slot over the poster image', () => {
    const { container } = render(
      <HeroSplit
        {...baseProps}
        variant="sino-canvas"
        image={image('Sino poster')}
        canvas={<canvas data-testid="canvas" />}
      />,
    )
    const slot = container.querySelector('[data-slot="sino-canvas"]') as HTMLElement
    expect(within(slot).getByTestId('canvas')).toBeTruthy()
    // The decorative canvas must not be announced; the poster stays the accessible image.
    expect(slot.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByAltText('Sino poster')).toBeTruthy()
  })

  it('sino-canvas without a canvas still shows the poster (the CPR-77 swap point is empty)', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-canvas" image={image('Sino poster')} />,
    )
    expect(container.querySelector('[data-slot="sino-canvas"]')).toBeNull()
    expect(screen.getByAltText('Sino poster')).toBeTruthy()
  })

  it('mockup: chat bubbles and floating chips from the DTO, hidden from assistive tech', () => {
    const { container } = render(
      <HeroSplit
        {...baseProps}
        variant="mockup"
        mockup={{
          bubbles: product.hero.mockup.bubbles,
          chips: product.hero.mockup.chips,
        }}
      />,
    )
    const phone = container.querySelector('[data-slot="phone-frame"]') as HTMLElement
    expect(phone.getAttribute('aria-hidden')).toBe('true')
    for (const bubble of product.hero.mockup.bubbles) {
      expect(within(phone).getByText(bubble.text)).toBeTruthy()
    }
    const chips = container.querySelectorAll('[data-slot="ui-chip"]')
    expect(chips).toHaveLength(product.hero.mockup.chips.length)
  })

  it('scene: an image in a media frame, no stage', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="scene" image={image('Team at work')} />,
    )
    const frame = container.querySelector('[data-slot="media-frame"]') as HTMLElement
    expect(within(frame).getByAltText('Team at work')).toBeTruthy()
    expect(container.querySelector('[data-slot="sino-stage"]')).toBeNull()
  })

  it('marks the hero image as high priority when asked (LCP candidate)', () => {
    render(<HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} priority />)
    expect(screen.getByAltText('Sino').getAttribute('fetchpriority')).toBe('high')
  })

  it('does not set high priority by default', () => {
    render(<HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />)
    expect(screen.getByAltText('Sino').getAttribute('fetchpriority')).toBeNull()
  })
})

describe('HeroSplit entrance (motion.md section 3.2)', () => {
  const entranceSteps = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>('[data-hero-delay]')].map((el) => ({
      delay: Number(el.getAttribute('data-hero-delay')),
      from: el.getAttribute('data-hero-from'),
    }))

  it('server-renders the final state: no inline from-state in the HTML', () => {
    const html = renderToString(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    expect(html).not.toMatch(/opacity:\s*0/)
    expect(html).not.toMatch(/translate/)
    // Content is present in the server HTML (works without JavaScript).
    expect(html).toContain(home.hero.headline)
  })

  it('annotates every step with its delay: lead 180, CTA 260, visual 200', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    const delays = entranceSteps(container).map((s) => s.delay)
    expect(delays).toEqual([0, 0, 180, 260, 200])
  })

  it('applies the from-state before paint on the client, then plays to the final state', () => {
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    const els = [...container.querySelectorAll<HTMLElement>('[data-hero-delay]')]
    expect(els.length).toBeGreaterThan(0)
    for (const el of els) expect(el.style.opacity).toBe('0')
    const lead = container.querySelector<HTMLElement>('[data-hero-from="rise-12"]')
    expect(lead?.style.transform).toContain('translateY(12px)')
    const visual = container.querySelector<HTMLElement>('[data-hero-from="scale"]')
    expect(visual?.style.transform).toContain('scale(0.92)')

    act(() => {
      for (const cb of frames.splice(0)) cb(0)
    })
    for (const el of els) {
      expect(el.style.opacity).toBe('')
      expect(el.style.transition).toContain('opacity')
    }
    const cta = container.querySelector<HTMLElement>('#hero-cta')
    expect(cta?.style.transition).toContain('260ms')
  })

  it('is a no-op under reduced motion', () => {
    stubMedia({ [REDUCED]: true })
    const { container } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    for (const el of container.querySelectorAll<HTMLElement>('[data-hero-delay]')) {
      expect(el.getAttribute('style')).toBeNull()
    }
    expect(frames).toHaveLength(0)
  })

  it('restores the final state if it unmounts mid-entrance', () => {
    const { container, unmount } = render(
      <HeroSplit {...baseProps} variant="sino-still" image={image('Sino')} />,
    )
    const el = container.querySelector<HTMLElement>('[data-hero-delay]') as HTMLElement
    expect(el.style.opacity).toBe('0')
    unmount()
    expect(el.style.opacity).toBe('')
  })
})

describe('SinoStage (mascot-sino.md section 4)', () => {
  it('has a glow, two orbit arcs, a contact shadow and the Sino slot', () => {
    const { container } = render(
      <SinoStage>
        <img alt="Sino" src="data:," />
      </SinoStage>,
    )
    const stage = container.querySelector('[data-slot="sino-stage"]') as HTMLElement
    expect(stage.querySelector('[data-slot="stage-glow"]')).toBeTruthy()
    expect(stage.querySelectorAll('[data-slot="orbit-arc"]')).toHaveLength(2)
    expect(stage.querySelector('[data-slot="contact-shadow"]')).toBeTruthy()
    expect(within(stage).getByAltText('Sino')).toBeTruthy()
  })

  it('hides the decoration from assistive tech', () => {
    const { container } = render(<SinoStage>x</SinoStage>)
    for (const slot of ['stage-glow', 'stage-orbit', 'contact-shadow']) {
      expect(
        container.querySelector(`[data-slot="${slot}"]`)?.getAttribute('aria-hidden'),
        slot,
      ).toBe('true')
    }
  })
})
