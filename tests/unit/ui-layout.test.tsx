import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from '../../src/components/ui/card'
import { Container } from '../../src/components/ui/container'
import { Section } from '../../src/components/ui/section'
import { SectionHeader } from '../../src/components/ui/section-header'
import { Split } from '../../src/components/ui/split'

const has = (el: Element, ...classes: string[]) => classes.every((c) => el.classList.contains(c))
const byTestId = (id: string) => screen.getByTestId(id)

describe('Container', () => {
  it('centres content at the content width with the responsive gutter', () => {
    render(<Container data-testid="c">Content</Container>)
    expect(
      has(byTestId('c'), 'mx-auto', 'w-full', 'max-w-(--container-max)', 'px-(--gutter)'),
    ).toBe(true)
  })

  it.each([
    ['wide', 'max-w-(--container-max-wide)'],
    ['text', 'max-w-(--container-text)'],
  ] as const)('supports the %s size', (size, expected) => {
    render(
      <Container data-testid="c" size={size}>
        x
      </Container>,
    )
    expect(has(byTestId('c'), expected)).toBe(true)
    expect(byTestId('c').classList.contains('max-w-(--container-max)')).toBe(false)
  })

  it('can render as another element', () => {
    render(
      <Container as="main" data-testid="c">
        x
      </Container>,
    )
    expect(byTestId('c').tagName).toBe('MAIN')
  })
})

describe('Section', () => {
  it('is a section band with the fluid vertical rhythm on the canvas tone', () => {
    render(<Section data-testid="s">Body</Section>)
    const section = byTestId('s')
    expect(section.tagName).toBe('SECTION')
    expect(has(section, 'py-(--section-y)', 'bg-canvas')).toBe(true)
    expect(section.getAttribute('data-tone')).toBe('canvas')
  })

  it.each([
    ['canvas', ['bg-canvas']],
    ['alt', ['bg-canvas-alt']],
    ['tint', ['bg-surface-tint']],
    ['warm', ['bg-surface-warm']],
    ['inverse', ['bg-surface-inverse', 'text-text-inverse']],
    ['aurora', ['bg-canvas', 'bg-(image:--gradient-aurora)']],
  ] as const)('maps the %s tone to its surface classes', (tone, expected) => {
    render(
      <Section data-testid="s" tone={tone}>
        x
      </Section>,
    )
    expect(has(byTestId('s'), ...expected)).toBe(true)
    expect(byTestId('s').getAttribute('data-tone')).toBe(tone)
  })

  it('does not leak another tone background', () => {
    render(
      <Section data-testid="s" tone="warm">
        x
      </Section>,
    )
    expect(byTestId('s').classList.contains('bg-canvas')).toBe(false)
  })

  it('can render as another element and merges className', () => {
    render(
      <Section data-testid="s" as="div" className="relative">
        x
      </Section>,
    )
    expect(byTestId('s').tagName).toBe('DIV')
    expect(byTestId('s').classList.contains('relative')).toBe(true)
  })
})

describe('Split', () => {
  it('keeps text before visual in the DOM so the visual stacks second on mobile', () => {
    render(<Split data-testid="split" text={<p>Text</p>} visual={<img alt="Visual" />} />)
    const children = Array.from(byTestId('split').children)
    expect(children).toHaveLength(2)
    expect(children[0].textContent).toBe('Text')
    expect(children[1].querySelector('img')).not.toBeNull()
  })

  it('uses a 12 column grid with five text columns and seven visual columns', () => {
    render(<Split data-testid="split" text="Text" visual="Visual" />)
    const [text, visual] = Array.from(byTestId('split').children)
    expect(has(byTestId('split'), 'grid', 'grid-cols-1', 'lg:grid-cols-12')).toBe(true)
    expect(has(text, 'lg:col-span-5')).toBe(true)
    expect(has(visual, 'lg:col-span-7')).toBe(true)
  })

  it('places the visual first on desktop when reversed, without changing the DOM order', () => {
    render(<Split data-testid="split" reverse text="Text" visual="Visual" />)
    const [text, visual] = Array.from(byTestId('split').children)
    expect(text.textContent).toBe('Text')
    expect(has(visual, 'lg:col-start-1', 'lg:col-span-7', 'lg:row-start-1')).toBe(true)
    expect(has(text, 'lg:col-start-8', 'lg:col-span-5', 'lg:row-start-1')).toBe(true)
  })
})

describe('SectionHeader', () => {
  it('renders eyebrow, h2 title, lead and action, centred by default', () => {
    render(
      <SectionHeader
        data-testid="header"
        eyebrow="Product"
        title="Hand off the busywork"
        lead="Sino replies to customers."
        action={<a href="/x">Join the waitlist</a>}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Hand off the busywork' })).toBeTruthy()
    expect(screen.getByText('Product').classList.contains('font-mono')).toBe(true)
    expect(screen.getByText('Sino replies to customers.').classList.contains('text-lead')).toBe(
      true,
    )
    expect(screen.getByRole('link', { name: 'Join the waitlist' })).toBeTruthy()
    expect(has(byTestId('header'), 'text-center', 'items-center')).toBe(true)
  })

  it('aligns to the start and can use another heading level', () => {
    render(<SectionHeader data-testid="header" align="start" titleAs="h1" title="Pricing" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Pricing' })).toBeTruthy()
    expect(has(byTestId('header'), 'text-start', 'items-start')).toBe(true)
    expect(byTestId('header').classList.contains('text-center')).toBe(false)
  })

  it('omits optional parts that are not supplied', () => {
    render(<SectionHeader data-testid="header" title="Pricing" />)
    expect(byTestId('header').children).toHaveLength(1)
  })

  it('styles the title with the h2 token and balanced wrapping', () => {
    render(<SectionHeader title="Pricing" />)
    expect(has(screen.getByRole('heading'), 'text-h2', 'text-text', 'text-balance')).toBe(true)
  })
})

describe('Card', () => {
  it('base card is a surface with the card radius, hairline border and small shadow', () => {
    render(<Card data-testid="card">Body</Card>)
    const card = byTestId('card')
    expect(card.tagName).toBe('DIV')
    expect(card.getAttribute('data-variant')).toBe('base')
    expect(has(card, 'bg-surface', 'rounded-card', 'shadow-sm', 'p-6', 'lg:p-8')).toBe(true)
    expect(card.classList.contains('[border:var(--border-hairline)]')).toBe(true)
  })

  it.each([
    ['path', ['rounded-xl', 'min-h-[420px]', 'relative', 'overflow-hidden']],
    ['task', ['rounded-xl', 'overflow-hidden']],
    ['feature', ['rounded-card', 'bg-surface']],
    ['work', ['rounded-card', 'overflow-hidden', 'p-0']],
    ['post', ['rounded-card', 'overflow-hidden', 'p-0']],
    ['stat', ['rounded-card', 'tabular-nums']],
    ['step', ['flex', 'gap-4']],
  ] as const)('maps the %s variant to its structure classes', (variant, expected) => {
    render(
      <Card data-testid="card" variant={variant}>
        x
      </Card>,
    )
    expect(has(byTestId('card'), ...expected)).toBe(true)
    expect(byTestId('card').getAttribute('data-variant')).toBe(variant)
  })

  it('tints path and task cards, which have no default surface', () => {
    render(
      <>
        <Card data-testid="product" variant="path" tone="tint" />
        <Card data-testid="services" variant="path" tone="warm" />
        <Card data-testid="alt" variant="task" tone="alt" />
      </>,
    )
    expect(has(byTestId('product'), 'bg-surface-tint')).toBe(true)
    expect(has(byTestId('services'), 'bg-surface-warm')).toBe(true)
    expect(has(byTestId('alt'), 'bg-canvas-alt')).toBe(true)
    expect(byTestId('product').classList.contains('bg-surface')).toBe(false)
  })

  it('defaults path and task cards to a tint rather than a plain surface', () => {
    render(<Card data-testid="card" variant="path" />)
    expect(has(byTestId('card'), 'bg-surface-tint')).toBe(true)
  })

  it('gives the featured card the glow shadow instead of the default one', () => {
    render(<Card data-testid="card" variant="task" featured />)
    expect(has(byTestId('card'), 'shadow-glow')).toBe(true)
    expect(byTestId('card').classList.contains('shadow-sm')).toBe(false)
  })

  it('lifts on hover, moves with motion tokens and rings on focus when interactive', () => {
    render(<Card data-testid="card" interactive />)
    expect(
      has(
        byTestId('card'),
        'hover:-translate-y-1',
        'hover:shadow-md',
        'duration-(--dur-med)',
        'ease-out',
        'motion-reduce:transition-none',
        'focus-within:outline-2',
        'focus-within:outline-offset-2',
        'focus-within:outline-focus',
      ),
    ).toBe(true)
  })

  it('is static when not interactive', () => {
    render(<Card data-testid="card" />)
    expect(byTestId('card').classList.contains('hover:-translate-y-1')).toBe(false)
  })

  it('can render as a semantic element', () => {
    render(
      <ul>
        <Card as="li" data-testid="card" />
      </ul>,
    )
    expect(byTestId('card').tagName).toBe('LI')
  })
})
