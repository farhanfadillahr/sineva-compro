import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { DESKTOP_QUERY } from '../../src/components/layout/media-queries'
import { SiteHeader } from '../../src/components/layout/site-header'
import {
  installMatchMedia,
  navigationState,
  navServices,
  REDUCED_MOTION_QUERY,
  removeMatchMedia,
  renderWithIntl,
  resetScroll,
  scrollTo,
  whatsappSettings,
} from './layout-test-utils'

vi.mock('@/i18n/navigation', async () => (await import('./layout-test-utils')).navigationMock)

type HeaderProps = Partial<Parameters<typeof SiteHeader>[0]>

function renderHeader(props: HeaderProps = {}) {
  return renderWithIntl(
    <>
      <SiteHeader services={navServices} whatsapp={whatsappSettings} {...props} />
      <button type="button">outside</button>
    </>,
  )
}

const burger = () => screen.getByRole('button', { name: 'Open menu' })
const dialog = () => screen.getByRole('dialog', { name: 'Menu' })
const maybeDialog = () => screen.queryByRole('dialog', { name: 'Menu' })

/** Focusable elements the trap should cycle through: everything not inside a collapsed (inert) region. */
const focusables = () =>
  Array.from(dialog().querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
    (el) => !el.closest('[inert]'),
  )

let scrollToSpy: MockInstance<typeof window.scrollTo>

beforeEach(() => {
  navigationState.pathname = '/'
  resetScroll()
  removeMatchMedia()
  // jsdom implements scrollTo as "not implemented"; the scroll lock calls it to restore position.
  scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  scrollToSpy.mockRestore()
})

describe('mobile menu open and close', () => {
  it('opens a modal dialog from the burger and moves focus into it', async () => {
    const user = userEvent.setup()
    renderHeader()
    expect(maybeDialog()).toBeNull()
    await user.click(burger())
    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(burger().getAttribute('aria-expanded')).toBe('true')
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('opens from the keyboard', async () => {
    const user = userEvent.setup()
    renderHeader()
    burger().focus()
    await user.keyboard('{Enter}')
    expect(maybeDialog()).not.toBeNull()
  })

  it('closes on Escape and returns focus to the burger', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(burger())
    expect(burger().getAttribute('aria-expanded')).toBe('false')
    await waitFor(() => expect(maybeDialog()).toBeNull())
  })

  it('closes from its own close button', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    await user.click(within(dialog()).getByRole('button', { name: 'Close menu' }))
    expect(document.activeElement).toBe(burger())
    await waitFor(() => expect(maybeDialog()).toBeNull())
  })

  it('closes when a link inside is followed, because the layout stays mounted across navigation', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    await user.click(within(dialog()).getByRole('link', { name: 'Work' }))
    await waitFor(() => expect(maybeDialog()).toBeNull())
  })

  it('closes when the route changes underneath it', async () => {
    const user = userEvent.setup()
    const { rerender } = renderHeader()
    await user.click(burger())
    navigationState.pathname = '/about'
    rerender(
      <>
        <SiteHeader services={navServices} whatsapp={whatsappSettings} />
        <button type="button">outside</button>
      </>,
    )
    await waitFor(() => expect(maybeDialog()).toBeNull())
  })

  it('closes when the viewport grows to the desktop layout', async () => {
    const media = installMatchMedia({ [DESKTOP_QUERY]: false })
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(maybeDialog()).not.toBeNull()
    act(() => media.set(DESKTOP_QUERY, true))
    await waitFor(() => expect(maybeDialog()).toBeNull())
  })

  it('shows the language switcher slot nowhere while there is one locale', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(document.querySelector('[data-slot="language-switcher"]')).toBeNull()
  })
})

describe('mobile menu scroll lock', () => {
  it('locks the body in place at the current scroll offset', async () => {
    const user = userEvent.setup()
    renderHeader()
    act(() => scrollTo(120))
    await user.click(burger())
    // position: fixed with a negative top is the iOS-safe lock; overflow: hidden alone does not
    // stop Safari from scrolling the page behind a sheet.
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-120px')
  })

  it('restores the body styles and the scroll offset on close', async () => {
    const user = userEvent.setup()
    renderHeader()
    act(() => scrollTo(120))
    await user.click(burger())
    await user.keyboard('{Escape}')
    expect(document.body.style.position).toBe('')
    expect(document.body.style.top).toBe('')
    // 'instant' so a global `scroll-behavior: smooth` cannot animate the page back from the top.
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 120, left: 0, behavior: 'instant' })
  })

  it('releases the lock when unmounted while open', async () => {
    const user = userEvent.setup()
    const { unmount } = renderHeader()
    await user.click(burger())
    unmount()
    expect(document.body.style.position).toBe('')
  })

  it('keeps the header visible while open even if the page position changes', async () => {
    const user = userEvent.setup()
    renderHeader()
    act(() => scrollTo(50))
    await user.click(burger())
    act(() => scrollTo(300))
    expect(screen.getByRole('banner').getAttribute('data-hidden')).toBe('false')
  })

  it('ignores the offset jump to 0 while locked and does not hide the header after unlock', async () => {
    const user = userEvent.setup()
    renderHeader()
    act(() => scrollTo(120))
    act(() => scrollTo(110))
    await user.click(burger())
    // With the body fixed the browser reports offset 0; on unlock the saved offset is restored.
    // Counting either as a user scroll would hide the header the moment the menu closes.
    act(() => scrollTo(0))
    await user.keyboard('{Escape}')
    act(() => scrollTo(110))
    expect(screen.getByRole('banner').getAttribute('data-hidden')).toBe('false')
  })
})

describe('mobile menu focus trap', () => {
  it('wraps Tab from the last focusable element to the first', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    const items = focusables()
    items[items.length - 1].focus()
    await user.tab()
    expect(document.activeElement).toBe(items[0])
  })

  it('wraps Shift+Tab from the first focusable element to the last', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    const items = focusables()
    items[0].focus()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(items[items.length - 1])
  })

  it('pulls focus back when it escapes the dialog (screen reader virtual cursor, autofill)', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    act(() => screen.getByRole('button', { name: 'outside' }).focus())
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('never lists the links of a collapsed accordion in the tab order', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(screen.queryByRole('link', { name: /Customer chat/ })).toBeNull()
    expect(focusables().some((el) => /Customer chat/.test(el.textContent ?? ''))).toBe(false)
  })
})

describe('mobile menu content', () => {
  it('shows sections as accordions that open on click', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    const product = within(dialog()).getByRole('button', { name: 'Product' })
    expect(product.getAttribute('aria-expanded')).toBe('false')
    await user.click(product)
    expect(product.getAttribute('aria-expanded')).toBe('true')
    expect(
      within(dialog())
        .getByRole('link', { name: /Customer chat/ })
        .getAttribute('href'),
    ).toBe('/products/ai-agents')
    expect(within(dialog()).getByRole('link', { name: /Join the waitlist/ })).toBeTruthy()
    await user.click(product)
    expect(product.getAttribute('aria-expanded')).toBe('false')
    expect(within(dialog()).queryByRole('link', { name: /Customer chat/ })).toBeNull()
  })

  it('lists the services from content and a link to all services', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    await user.click(within(dialog()).getByRole('button', { name: 'Services' }))
    expect(
      within(dialog())
        .getByRole('link', { name: /AI Build/ })
        .getAttribute('href'),
    ).toBe('/services/ai-build')
    expect(within(dialog()).getByRole('link', { name: 'See all services' })).toBeTruthy()
  })

  it('lists Work, Blog and About as plain links', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(within(dialog()).getByRole('link', { name: 'Work' }).getAttribute('href')).toBe('/work')
    expect(within(dialog()).getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/blog')
    expect(within(dialog()).getByRole('link', { name: 'About' }).getAttribute('href')).toBe(
      '/about',
    )
  })

  it('marks the current page with aria-current', async () => {
    navigationState.pathname = '/blog'
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(within(dialog()).getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('has a bottom action bar with the primary CTA and WhatsApp', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(
      within(dialog()).getByRole('link', { name: 'Book a free consultation' }).getAttribute('href'),
    ).toBe('/contact')
    const whatsapp = within(dialog()).getByRole('link', { name: 'Chat on WhatsApp' })
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/6280000000000\?text=/)
    expect(whatsapp.getAttribute('data-analytics')).toBe('whatsapp_click')
    expect(whatsapp.getAttribute('data-location')).toBe('mobile_menu')
  })

  it('leaves out WhatsApp when there is no number', async () => {
    const user = userEvent.setup()
    renderHeader({ whatsapp: null })
    await user.click(burger())
    expect(within(dialog()).queryByRole('link', { name: /WhatsApp/ })).toBeNull()
    expect(within(dialog()).getByRole('link', { name: 'Book a free consultation' })).toBeTruthy()
  })
})

describe('mobile menu motion', () => {
  it('uses the wipe by default', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(dialog().getAttribute('data-motion')).toBe('full')
  })

  it('switches to a short fade under reduced motion', async () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    const user = userEvent.setup()
    renderHeader()
    await user.click(burger())
    expect(dialog().getAttribute('data-motion')).toBe('reduced')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(maybeDialog()).toBeNull(), { timeout: 400 })
  })
})
