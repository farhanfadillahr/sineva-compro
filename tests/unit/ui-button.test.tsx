import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../../src/components/ui/button'

const has = (el: HTMLElement, ...classes: string[]) =>
  classes.every((c) => el.classList.contains(c))

describe('Button variants', () => {
  it('defaults to a primary, medium, non-submitting <button>', () => {
    render(<Button>Book a free consultation</Button>)
    const button = screen.getByRole('button', { name: 'Book a free consultation' })
    expect(button.tagName).toBe('BUTTON')
    // Native default is type=submit, which would submit any surrounding form by accident.
    expect(button.getAttribute('type')).toBe('button')
    expect(has(button, 'bg-action-primary', 'text-text-inverse', 'rounded-pill', 'h-11')).toBe(true)
  })

  it('lets forms opt in to submit', () => {
    render(<Button type="submit">Send message</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  })

  it.each([
    [
      'primary',
      ['bg-action-primary', 'hover:bg-action-primary-hover', 'rounded-pill', 'shadow-button-bevel'],
    ],
    ['dark', ['bg-action-dark', 'text-text-inverse', 'rounded-sm', 'shadow-button-bevel']],
    ['secondary', ['bg-surface', 'text-text', 'rounded-pill', 'shadow-button-bevel-light']],
    ['ghost', ['bg-transparent', 'text-text', 'rounded-sm', 'hover:bg-canvas-alt']],
    ['link', ['text-(--color-link)', 'underline-offset-4']],
    ['whatsapp', ['bg-surface', 'text-text', 'rounded-pill', 'shadow-button-bevel-light']],
  ] as const)('maps the %s variant to its token classes', (variant, expected) => {
    render(<Button variant={variant}>Label</Button>)
    const button = screen.getByRole('button')
    expect(has(button, ...expected)).toBe(true)
    expect(button.getAttribute('data-variant')).toBe(variant)
  })

  it('keeps pill shapes for marketing CTAs and rounded squares for compact UI', () => {
    const { rerender } = render(<Button variant="dark">Label</Button>)
    expect(screen.getByRole('button').classList.contains('rounded-pill')).toBe(false)
    rerender(<Button variant="ghost">Label</Button>)
    expect(screen.getByRole('button').classList.contains('rounded-pill')).toBe(false)
    rerender(<Button variant="primary">Label</Button>)
    expect(screen.getByRole('button').classList.contains('rounded-pill')).toBe(true)
  })

  it.each([
    ['sm', 'h-9', 'px-3.5'],
    ['md', 'h-11', 'px-5'],
    ['lg', 'h-13', 'px-6'],
    ['xl', 'h-15', 'px-7'],
  ] as const)('maps size %s to %s and %s', (size, height, padding) => {
    render(<Button size={size}>Label</Button>)
    const button = screen.getByRole('button')
    expect(has(button, height, padding)).toBe(true)
    expect(button.getAttribute('data-size')).toBe(size)
  })

  it('extends the small button hit area to 44px while the visible height stays 36px', () => {
    render(<Button size="sm">Label</Button>)
    expect(has(screen.getByRole('button'), 'h-9', 'after:h-11', 'after:absolute')).toBe(true)
  })

  it('shows a focus-visible ring of 2px colour-focus with a 2px offset on every variant', () => {
    for (const variant of ['primary', 'dark', 'secondary', 'ghost', 'link', 'whatsapp'] as const) {
      const { unmount } = render(<Button variant={variant}>Label</Button>)
      expect(
        has(
          screen.getByRole('button'),
          'focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-focus',
        ),
        variant,
      ).toBe(true)
      unmount()
    }
  })

  it('animates with the motion tokens and honours reduced motion', () => {
    render(<Button>Label</Button>)
    const button = screen.getByRole('button')
    expect(has(button, 'duration-(--dur-base)', 'ease-out', 'motion-reduce:transition-none')).toBe(
      true,
    )
    expect(has(button, 'active:scale-[0.98]')).toBe(true)
  })

  it('appends a caller className after the variant classes', () => {
    render(<Button className="w-full">Label</Button>)
    const button = screen.getByRole('button')
    expect(button.classList.contains('w-full')).toBe(true)
    expect(button.className.endsWith('w-full')).toBe(true)
  })

  it('forwards native attributes and the ref', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(
      <Button ref={ref} name="intent" value="waitlist" aria-label="Join">
        Label
      </Button>,
    )
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Join' }))
    expect(ref.current?.getAttribute('name')).toBe('intent')
  })
})

describe('Button anatomy', () => {
  it('renders decorative leading and trailing icons hidden from assistive tech', () => {
    render(
      <Button leadingIcon={<svg data-testid="lead" />} trailingIcon={<svg data-testid="trail" />}>
        Chat on WhatsApp
      </Button>,
    )
    expect(screen.getByTestId('lead').parentElement?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByTestId('trail').parentElement?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('button', { name: 'Chat on WhatsApp' })).toBeTruthy()
  })

  it('adds a trailing arrow that nudges on hover when withArrow is set', () => {
    render(<Button withArrow>Explore services</Button>)
    const button = screen.getByRole('button')
    const arrow = button.querySelector('[data-slot="arrow"]')
    expect(arrow).not.toBeNull()
    expect(arrow?.getAttribute('aria-hidden')).toBe('true')
    expect(arrow?.classList.contains('group-hover/button:translate-x-[3px]')).toBe(true)
    expect(button.classList.contains('group/button')).toBe(true)
  })
})

describe('Button disabled and loading', () => {
  it('disables the control, dims it and ignores clicks', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Send message
      </Button>,
    )
    const button = screen.getByRole('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(has(button, 'disabled:opacity-45', 'disabled:pointer-events-none')).toBe(true)
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not mark an enabled button aria-disabled or aria-busy', () => {
    render(<Button>Label</Button>)
    const button = screen.getByRole('button')
    expect(button.hasAttribute('aria-disabled')).toBe(false)
    expect(button.hasAttribute('aria-busy')).toBe(false)
  })

  it('keeps the label, shows a spinner, sets aria-busy and blocks clicks while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading loadingLabel="Sending" withArrow onClick={onClick}>
        Send message
      </Button>,
    )
    const button = screen.getByRole('button', { name: /Send message/ }) as HTMLButtonElement
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.textContent).toContain('Send message')
    const spinner = button.querySelector('[data-slot="spinner"]')
    expect(spinner).not.toBeNull()
    expect(spinner?.getAttribute('aria-hidden')).toBe('true')
    // The spinner takes the place of the trailing icon rather than adding a second one.
    expect(button.querySelector('[data-slot="arrow"]')).toBeNull()
    expect(button.querySelector('[data-slot="loading-label"]')?.textContent).toBe('Sending')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('omits the loading label element when no text is supplied (strings come from props)', () => {
    render(<Button loading>Send message</Button>)
    expect(document.querySelector('[data-slot="loading-label"]')).toBeNull()
  })
})

describe('Button keyboard', () => {
  it('is reachable with Tab and activates with Enter and Space', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Label</Button>)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button'))
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('skips a disabled button in the tab order', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Button disabled>First</Button>
        <Button>Second</Button>
      </>,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Second' }))
  })
})

describe('Button polymorphism', () => {
  it('renders an <a> when given an href', () => {
    render(<Button href="/contact">Contact</Button>)
    const link = screen.getByRole('link', { name: 'Contact' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/contact')
    expect(link.hasAttribute('type')).toBe(false)
    expect(screen.queryByRole('button')).toBeNull()
    expect(has(link, 'bg-action-primary', 'inline-flex')).toBe(true)
  })

  it('opens external targets safely', () => {
    render(
      <Button href="https://wa.me/628123" target="_blank">
        Chat on WhatsApp
      </Button>,
    )
    const rel = screen.getByRole('link').getAttribute('rel') ?? ''
    expect(rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
  })

  it('keeps a caller supplied rel', () => {
    render(
      <Button href="https://example.com" target="_blank" rel="author">
        Link
      </Button>,
    )
    expect(screen.getByRole('link').getAttribute('rel')).toBe('author')
  })

  it('renders the supplied link component (next-intl Link) instead of a plain anchor', () => {
    const calls: unknown[] = []
    const FakeIntlLink = ({
      href,
      children,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
      calls.push(href)
      return (
        <a data-fake-intl-link href={`/en${href}`} {...rest}>
          {children}
        </a>
      )
    }
    render(
      <Button href="/services" linkComponent={FakeIntlLink} variant="secondary">
        Explore services
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Explore services' })
    expect(link.hasAttribute('data-fake-intl-link')).toBe(true)
    expect(link.getAttribute('href')).toBe('/en/services')
    expect(calls).toEqual(['/services'])
    expect(has(link, 'bg-surface', 'rounded-pill')).toBe(true)
  })

  it('ignores linkComponent when there is no href and renders a button', () => {
    const Never = () => <span data-never />
    render(<Button linkComponent={Never}>Label</Button>)
    expect(screen.getByRole('button')).toBeTruthy()
    expect(document.querySelector('[data-never]')).toBeNull()
  })

  it('turns a disabled link into an inert, announced-as-disabled link without an href', async () => {
    const onClick = vi.fn()
    render(
      <Button href="/contact" disabled onClick={onClick}>
        Contact
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Contact' })
    expect(link.hasAttribute('href')).toBe(false)
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.getAttribute('tabindex')).toBe('-1')
    await userEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('treats a loading link like a disabled one and sets aria-busy', () => {
    render(
      <Button href="/contact" loading>
        Contact
      </Button>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('aria-busy')).toBe('true')
    expect(link.hasAttribute('href')).toBe(false)
  })

  it('focuses a link with the keyboard and activates it with Enter', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    const user = userEvent.setup()
    render(
      <Button href="/contact" onClick={onClick}>
        Contact
      </Button>,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('link'))
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
