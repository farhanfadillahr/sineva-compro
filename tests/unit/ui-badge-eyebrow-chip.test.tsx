import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Badge } from '../../src/components/ui/badge'
import { Chip } from '../../src/components/ui/chip'
import { Eyebrow } from '../../src/components/ui/eyebrow'

const has = (el: Element, ...classes: string[]) => classes.every((c) => el.classList.contains(c))

describe('Badge', () => {
  it('is a 24px tall extra-small radius label defaulting to the brand tone', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge.tagName).toBe('SPAN')
    expect(
      has(badge, 'h-6', 'rounded-xs', 'font-medium', 'bg-surface-tint', 'text-text-brand'),
    ).toBe(true)
  })

  it.each([
    ['brand', ['bg-surface-tint', 'text-text-brand']],
    ['warm', ['bg-surface-warm', 'text-text']],
    ['neutral', ['bg-canvas-alt', 'text-text-secondary']],
    ['success', ['bg-success-surface', 'text-success']],
    ['danger', ['bg-danger-surface', 'text-danger']],
  ] as const)('maps the %s tone to semantic token classes', (tone, expected) => {
    render(<Badge tone={tone}>Label</Badge>)
    const badge = screen.getByText('Label')
    expect(has(badge, ...expected)).toBe(true)
    expect(badge.getAttribute('data-tone')).toBe(tone)
  })

  it('soon adds a decorative pulsing dot that stops under reduced motion', () => {
    render(<Badge soon>Coming soon</Badge>)
    const badge = screen.getByText('Coming soon')
    const dot = badge.querySelector('[data-slot="dot"]')
    expect(dot).not.toBeNull()
    expect(dot?.getAttribute('aria-hidden')).toBe('true')
    expect(has(dot!, 'animate-dot-pulse', 'motion-reduce:animate-none', 'size-1.5')).toBe(true)
    expect(has(badge, 'bg-surface-tint', 'text-text-brand')).toBe(true)
  })

  it('has no dot unless soon is set', () => {
    render(<Badge>Label</Badge>)
    expect(document.querySelector('[data-slot="dot"]')).toBeNull()
  })
})

describe('Eyebrow', () => {
  it('renders mono, uppercase, brand coloured text as a paragraph by default', () => {
    render(<Eyebrow>Product</Eyebrow>)
    const eyebrow = screen.getByText('Product')
    expect(eyebrow.tagName).toBe('P')
    expect(has(eyebrow, 'font-mono', 'uppercase', 'text-eyebrow', 'text-text-brand')).toBe(true)
  })

  it('can render as another element', () => {
    render(<Eyebrow as="span">Product</Eyebrow>)
    expect(screen.getByText('Product').tagName).toBe('SPAN')
  })

  it('uses the inverse text colour on dark sections', () => {
    render(<Eyebrow tone="inverse">Product</Eyebrow>)
    const eyebrow = screen.getByText('Product')
    expect(has(eyebrow, 'text-text-inverse')).toBe(true)
    expect(eyebrow.classList.contains('text-text-brand')).toBe(false)
  })

  it('draws an optional decorative leading dot', () => {
    render(<Eyebrow dot>Product</Eyebrow>)
    const dot = screen.getByText('Product').querySelector('[data-slot="dot"]')
    expect(dot?.getAttribute('aria-hidden')).toBe('true')
    expect(dot?.classList.contains('size-1.5')).toBe(true)
  })
})

describe('Chip', () => {
  it('is an unselected pill toggle button by default', () => {
    render(<Chip>Case study</Chip>)
    const chip = screen.getByRole('button', { name: 'Case study' })
    expect(chip.getAttribute('type')).toBe('button')
    expect(chip.getAttribute('aria-pressed')).toBe('false')
    expect(has(chip, 'h-9', 'rounded-pill', 'bg-canvas-alt', 'text-text')).toBe(true)
    expect(chip.querySelector('[data-slot="check"]')).toBeNull()
  })

  it('shows the selected state with tint, brand text and a check icon', () => {
    render(<Chip selected>Case study</Chip>)
    const chip = screen.getByRole('button')
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(has(chip, 'bg-surface-tint', 'text-text-brand')).toBe(true)
    expect(chip.classList.contains('bg-canvas-alt')).toBe(false)
    expect(chip.querySelector('[data-slot="check"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('has a visible focus ring, a 44px hit area and press feedback', () => {
    render(<Chip>Label</Chip>)
    expect(
      has(
        screen.getByRole('button'),
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-focus',
        'after:h-11',
        'active:scale-[0.96]',
      ),
    ).toBe(true)
  })

  it('toggles with the keyboard', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Chip onClick={onClick}>Label</Chip>)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button'))
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('does not fire while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Chip disabled onClick={onClick}>
        Label
      </Chip>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true')
  })

  it('renders a link with aria-current instead of aria-pressed when it filters by URL', () => {
    render(
      <Chip href="/blog?category=ai" selected>
        AI
      </Chip>,
    )
    const chip = screen.getByRole('link', { name: 'AI' })
    expect(chip.getAttribute('href')).toBe('/blog?category=ai')
    expect(chip.getAttribute('aria-current')).toBe('true')
    expect(chip.hasAttribute('aria-pressed')).toBe(false)
  })
})
