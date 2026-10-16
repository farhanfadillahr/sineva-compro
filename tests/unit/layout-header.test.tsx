import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from '../../src/components/layout/language-switcher'
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

const header = () => screen.getByRole('banner')
const trigger = (name: 'Product' | 'Services') => screen.getByRole('button', { name })
const panel = () => document.querySelector<HTMLElement>('[data-slot="nav-panel"]')!

beforeEach(() => {
  navigationState.pathname = '/'
  resetScroll()
  removeMatchMedia()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SiteHeader structure', () => {
  it('renders the logo lockup linking home, the primary nav and both CTAs', () => {
    renderHeader()
    const logo = screen.getByRole('link', { name: 'Sineva home' })
    expect(logo.getAttribute('href')).toBe('/')
    expect(within(logo).getByText('Sineva')).toBeTruthy()

    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const name of ['Product', 'Services']) {
      expect(within(nav).getByRole('button', { name })).toBeTruthy()
    }
    expect(within(nav).getByRole('link', { name: 'Work' }).getAttribute('href')).toBe('/work')
    expect(within(nav).getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/blog')
    expect(within(nav).getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about')

    expect(
      screen.getByRole('link', { name: 'Book a free consultation' }).getAttribute('href'),
    ).toBe('/contact')
  })

  it('has no theme toggle and no language switcher while there is one locale', () => {
    renderHeader()
    expect(screen.queryByRole('button', { name: /theme|dark mode|light mode/i })).toBeNull()
    expect(document.querySelector('[data-slot="language-switcher"]')).toBeNull()
  })

  it('offers a 44 px burger for the mobile menu', () => {
    renderHeader()
    const burger = screen.getByRole('button', { name: 'Open menu' })
    expect(burger.getAttribute('aria-expanded')).toBe('false')
    expect(burger.classList.contains('size-11')).toBe(true)
  })

  it('marks the current page and its section with aria-current', () => {
    navigationState.pathname = '/work'
    const { unmount } = renderHeader()
    expect(screen.getByRole('link', { name: 'Work' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBeNull()
    unmount()

    navigationState.pathname = '/work/some-project'
    renderHeader()
    expect(screen.getByRole('link', { name: 'Work' }).getAttribute('aria-current')).toBe('true')
  })

  it('marks the logo as current on the home page', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Sineva home' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })
})

describe('SiteHeader WhatsApp button', () => {
  it('links to wa.me with the general template and the analytics hook', () => {
    renderHeader()
    const link = screen.getByRole('link', { name: 'Chat on WhatsApp' })
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/6280000000000?text=${encodeURIComponent(whatsappSettings.templates.general)}`,
    )
    expect(link.getAttribute('data-analytics')).toBe('whatsapp_click')
    expect(link.getAttribute('data-location')).toBe('header')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('uses the template of the current page context', () => {
    navigationState.pathname = '/products/ai-agents'
    renderHeader()
    expect(screen.getByRole('link', { name: 'Chat on WhatsApp' }).getAttribute('href')).toContain(
      encodeURIComponent(whatsappSettings.templates.product),
    )
  })

  it.each([
    ['missing settings', null],
    ['an empty number', { ...whatsappSettings, number: '' }],
    ['an invalid number', { ...whatsappSettings, number: '0812' }],
  ])('renders no WhatsApp button for %s', (_label, whatsapp) => {
    renderHeader({ whatsapp })
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull()
  })
})

const mode = () => header().getAttribute('data-mode')
const bar = () => document.querySelector<HTMLElement>('[data-slot="header-bar"]')!

describe('SiteHeader floating nav (modes)', () => {
  it('is the regular transparent header at the top', () => {
    renderHeader()
    expect(mode()).toBe('top')
    act(() => scrollTo(8))
    expect(mode()).toBe('top')
  })

  it('hides when scrolling down past 8 px and floats back in on scroll up', () => {
    renderHeader()
    act(() => scrollTo(9))
    expect(mode()).toBe('floating-hidden')
    act(() => scrollTo(100))
    expect(mode()).toBe('floating-hidden')
    act(() => scrollTo(95))
    expect(mode()).toBe('floating-visible')
  })

  it('morphs back into the regular header on reaching the top', () => {
    renderHeader()
    act(() => scrollTo(300))
    act(() => scrollTo(290))
    expect(mode()).toBe('floating-visible')
    act(() => scrollTo(0))
    expect(mode()).toBe('top')
  })

  it('starts hidden when the page loads already scrolled down', () => {
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true, writable: true })
    renderHeader()
    expect(mode()).toBe('floating-hidden')
  })

  it('stays in normal flow (sticky, never fixed) so floating never reflows the page', () => {
    renderHeader()
    const classes = header().className.split(/\s+/)
    expect(classes).toContain('sticky')
    expect(classes).not.toContain('fixed')
  })

  it('keeps the logo intro landing slot exactly once, inside the bar, in every mode', () => {
    renderHeader()
    const slot = () => document.querySelectorAll('[data-logo-intro-target]')
    expect(slot()).toHaveLength(1)
    expect(bar().contains(slot()[0])).toBe(true)
    act(() => scrollTo(300))
    expect(slot()).toHaveLength(1)
    act(() => scrollTo(290))
    expect(slot()).toHaveLength(1)
  })

  it('never hides while a dropdown is open', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    act(() => scrollTo(300))
    expect(mode()).toBe('floating-visible')
  })

  it('never hides while keyboard focus is inside the header', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.tab()
    expect(header().contains(document.activeElement)).toBe(true)
    act(() => scrollTo(300))
    expect(mode()).toBe('floating-visible')
  })

  it('shows a hidden header when keyboard focus enters it', async () => {
    const user = userEvent.setup()
    renderHeader()
    act(() => scrollTo(300))
    expect(mode()).toBe('floating-hidden')
    await user.tab()
    expect(mode()).toBe('floating-visible')
  })

  it('resumes hiding once focus leaves the header', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'outside' }))
    act(() => scrollTo(300))
    expect(mode()).toBe('floating-hidden')
  })

  it('does not keep the header pinned after a mouse click focused a link inside it', async () => {
    // A clicked link keeps focus after client-side navigation. Treating that as "keyboard focus"
    // would pin the header open until the visitor clicks elsewhere.
    const user = userEvent.setup()
    renderHeader()
    await user.click(screen.getByRole('link', { name: 'Blog' }))
    act(() => scrollTo(300))
    expect(mode()).toBe('floating-hidden')
  })

  it('exposes the reduced-motion preference so show, hide and morph can be instant', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    renderHeader()
    expect(header().getAttribute('data-motion')).toBe('reduced')
  })

  it('uses full motion by default', () => {
    renderHeader()
    expect(header().getAttribute('data-motion')).toBe('full')
  })
})

describe('SiteHeader floating nav (idle auto-hide)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // See the note in "SiteHeader dropdown hover": user-event needs this under Vitest fake timers.
    Object.assign(globalThis, { jest: { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) } })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'jest')
  })

  const setup = () => userEvent.setup({ delay: null })
  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  /** Floating and visible: scrolled down, then a little up. */
  const floatVisible = () => {
    act(() => scrollTo(300))
    act(() => scrollTo(290))
    expect(mode()).toBe('floating-visible')
  }

  it('hides after 2.5 s without scrolling, not before', () => {
    renderHeader()
    floatVisible()
    advance(2499)
    expect(mode()).toBe('floating-visible')
    advance(1)
    expect(mode()).toBe('floating-hidden')
  })

  it('restarts the countdown on every scroll event', () => {
    renderHeader()
    floatVisible()
    advance(2000)
    act(() => scrollTo(280))
    advance(2000)
    expect(mode()).toBe('floating-visible')
    advance(500)
    expect(mode()).toBe('floating-hidden')
  })

  it('shows again on the next upward scroll after an idle hide', () => {
    renderHeader()
    floatVisible()
    advance(2500)
    expect(mode()).toBe('floating-hidden')
    act(() => scrollTo(285))
    expect(mode()).toBe('floating-visible')
  })

  it('never auto-hides the regular header at the top', () => {
    renderHeader()
    advance(10_000)
    expect(mode()).toBe('top')
  })

  it('returning to the top cancels the idle hide and keeps the regular header', () => {
    renderHeader()
    floatVisible()
    act(() => scrollTo(0))
    advance(10_000)
    expect(mode()).toBe('top')
  })

  it('still applies under reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    renderHeader()
    floatVisible()
    advance(2500)
    expect(mode()).toBe('floating-hidden')
  })

  it('is paused while the pointer is over the nav and restarts when it leaves', async () => {
    const user = setup()
    renderHeader()
    floatVisible()
    await user.hover(screen.getByRole('link', { name: 'Blog' }))
    advance(10_000)
    expect(mode()).toBe('floating-visible')
    await user.unhover(screen.getByRole('link', { name: 'Blog' }))
    advance(2499)
    expect(mode()).toBe('floating-visible')
    advance(1)
    expect(mode()).toBe('floating-hidden')
  })

  it('ignores touch pointers, which have no hover', () => {
    renderHeader()
    floatVisible()
    fireEvent.pointerEnter(bar(), { pointerType: 'touch' })
    advance(2500)
    expect(mode()).toBe('floating-hidden')
  })

  it('is paused while keyboard focus is inside and restarts when it leaves', async () => {
    const user = setup()
    renderHeader()
    floatVisible()
    await user.tab()
    expect(header().contains(document.activeElement)).toBe(true)
    advance(10_000)
    expect(mode()).toBe('floating-visible')
    await user.click(screen.getByRole('button', { name: 'outside' }))
    advance(2500)
    expect(mode()).toBe('floating-hidden')
  })

  it('is paused while a dropdown is open and restarts when it closes', async () => {
    const user = setup()
    renderHeader()
    floatVisible()
    await user.click(trigger('Product'))
    advance(10_000)
    expect(mode()).toBe('floating-visible')
    await user.click(trigger('Product'))
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
    await user.click(screen.getByRole('button', { name: 'outside' }))
    advance(2500)
    expect(mode()).toBe('floating-hidden')
  })

  it('is paused while the mobile menu is open, and the nav stays visible', async () => {
    const user = setup()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderHeader()
    floatVisible()
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    advance(10_000)
    expect(mode()).toBe('floating-visible')
  })
})

describe('SiteHeader dropdowns', () => {
  it('starts closed with one shared panel', () => {
    renderHeader()
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelectorAll('[data-slot="nav-panel"]')).toHaveLength(1)
    expect(panel().getAttribute('data-state')).toBe('closed')
    expect(screen.queryByRole('link', { name: /Customer chat/ })).toBeNull()
  })

  it('opens the Product panel on click with capability items and the waitlist card', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
    expect(panel().getAttribute('data-state')).toBe('open')
    for (const title of [
      'Customer chat',
      'Social media',
      'Sales follow-up',
      'Finance and admin',
      'Daily operations',
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(title) }).getAttribute('href')).toBe(
        '/products/ai-agents',
      )
    }
    const promo = screen.getByRole('link', { name: /Join the waitlist/ })
    expect(promo.getAttribute('href')).toBe('/products/ai-agents')
  })

  it('opens the Services panel with the services from content and a link to all of them', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Services'))
    expect(screen.getByRole('link', { name: /AI Discovery/ }).getAttribute('href')).toBe(
      '/services/ai-discovery',
    )
    expect(screen.getByRole('link', { name: /AI Build/ }).getAttribute('href')).toBe(
      '/services/ai-build',
    )
    expect(screen.getByRole('link', { name: /AI Enablement/ }).getAttribute('href')).toBe(
      '/services/ai-enablement',
    )
    expect(screen.getByRole('link', { name: 'See all services' }).getAttribute('href')).toBe(
      '/services',
    )
  })

  it('keeps only one dropdown open and shares the panel between triggers', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    await user.click(trigger('Services'))
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('true')
    expect(panel().getAttribute('data-menu')).toBe('services')
    expect(screen.queryByRole('link', { name: /Customer chat/ })).toBeNull()
  })

  it('toggles closed when the open trigger is clicked again', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    await user.click(trigger('Product'))
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it.each([['{Enter}'], [' ']])('opens with %j from the keyboard', async (key) => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Product').focus()
    await user.keyboard(key)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Services'))
    await user.keyboard('{ArrowDown}')
    expect(panel().contains(document.activeElement)).toBe(true)
    await user.keyboard('{Escape}')
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger('Services'))
  })

  it('opens with ArrowDown on the trigger and focuses the first item', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Services').focus()
    await user.keyboard('{ArrowDown}')
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /AI Discovery/ }))
  })

  it('moves between items with the arrow keys, wrapping at both ends', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Services').focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /AI Build/ }))
    await user.keyboard('{ArrowUp}{ArrowUp}')
    // Up from the first item wraps to the last one, "See all services".
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'See all services' }))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /AI Discovery/ }))
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'See all services' }))
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /AI Discovery/ }))
  })

  it('moves focus from an open trigger into the panel with Tab', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Services'))
    trigger('Services').focus()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('link', { name: /AI Discovery/ }))
  })

  it('moves back to the trigger with Shift+Tab from the first item', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Services').focus()
    await user.keyboard('{ArrowDown}')
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(trigger('Services'))
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('true')
  })

  it('closes and continues at the next nav link when Tab leaves the last panel item', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Services').focus()
    await user.keyboard('{ArrowDown}{End}')
    await user.tab()
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Work' }))
  })

  it('closes when focus leaves the header', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    act(() => screen.getByRole('button', { name: 'outside' }).focus())
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it('closes on an outside click', async () => {
    const user = userEvent.setup()
    renderHeader()
    await user.click(trigger('Product'))
    await user.click(document.body)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it('moves focus between top-level items with ArrowLeft and ArrowRight', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Product').focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(trigger('Services'))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Work' }))
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(document.activeElement).toBe(trigger('Product'))
  })

  it('does not trap the Escape key when nothing is open', async () => {
    const user = userEvent.setup()
    renderHeader()
    trigger('Product').focus()
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(trigger('Product'))
  })

  it('exposes the reduced-motion preference on the panel so it opens without scale or morph', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    renderHeader()
    expect(panel().getAttribute('data-motion')).toBe('reduced')
  })
})

describe('SiteHeader dropdown hover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Testing Library only drains its own timers when it sees Jest's fake timers. Vitest's use the
    // same clock, so exposing the one function it calls is enough; without it every awaited
    // user-event call waits on a timer that never fires.
    Object.assign(globalThis, { jest: { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) } })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'jest')
  })

  // delay: null makes user-event skip its own setTimeout waits, which fake timers would stall.
  const setup = () => userEvent.setup({ delay: null })
  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms)
    })

  it('opens after the 80 ms intent delay, not before', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(79)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
    await advance(1)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
  })

  it('does not open when the pointer only passes over the trigger', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(40)
    await user.unhover(trigger('Product'))
    await advance(500)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it('switches panels at once when another trigger is hovered while one is open', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(80)
    await user.hover(trigger('Services'))
    expect(trigger('Services').getAttribute('aria-expanded')).toBe('true')
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it('closes a hover-opened panel shortly after the pointer leaves the header', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(80)
    await user.unhover(trigger('Product'))
    // A short grace period lets the pointer cross the gap between trigger and panel.
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
    await advance(300)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps the panel open while the pointer moves from the trigger into the panel', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(80)
    await user.unhover(trigger('Product'))
    await user.hover(panel())
    await advance(500)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
  })

  it('keeps a click-opened panel open when the pointer leaves', async () => {
    const user = setup()
    renderHeader()
    await user.click(trigger('Product'))
    await user.unhover(trigger('Product'))
    await advance(500)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
  })

  it('pins a hover-opened panel on click instead of closing it', async () => {
    const user = setup()
    renderHeader()
    await user.hover(trigger('Product'))
    await advance(80)
    await user.click(trigger('Product'))
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
    await user.unhover(trigger('Product'))
    await advance(500)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('true')
  })

  it('ignores touch pointers, which have no hover (click opens there)', async () => {
    renderHeader()
    fireEvent.pointerEnter(trigger('Product'), { pointerType: 'touch' })
    await advance(500)
    expect(trigger('Product').getAttribute('aria-expanded')).toBe('false')
  })
})

describe('LanguageSwitcher slot', () => {
  it('renders nothing while only one locale is enabled', () => {
    const { container } = renderWithIntl(<LanguageSwitcher locales={['en']} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders its slot once a second locale is enabled', () => {
    renderWithIntl(<LanguageSwitcher locales={['en', 'id']} />)
    expect(document.querySelector('[data-slot="language-switcher"]')).not.toBeNull()
  })
})
