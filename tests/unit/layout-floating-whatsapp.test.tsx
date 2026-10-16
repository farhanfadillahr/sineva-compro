import { act, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FloatingWhatsApp } from '../../src/components/layout/floating-whatsapp'
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

type Props = Partial<Parameters<typeof FloatingWhatsApp>[0]>

function renderButton(props: Props = {}) {
  return renderWithIntl(
    <FloatingWhatsApp whatsapp={whatsappSettings} services={navServices} {...props} />,
  )
}

const link = () => screen.getByRole('link', { name: 'Chat with us on WhatsApp' })
const root = () => document.querySelector<HTMLElement>('[data-slot="floating-whatsapp"]')!

beforeEach(() => {
  navigationState.pathname = '/'
  resetScroll()
  removeMatchMedia()
})

describe('FloatingWhatsApp', () => {
  it('links to wa.me with the general template and the analytics hook', () => {
    renderButton()
    expect(link().getAttribute('href')).toBe(
      `https://wa.me/6280000000000?text=${encodeURIComponent(whatsappSettings.templates.general)}`,
    )
    expect(link().getAttribute('data-analytics')).toBe('whatsapp_click')
    expect(link().getAttribute('data-location')).toBe('floating')
    expect(link().getAttribute('target')).toBe('_blank')
    expect(link().getAttribute('rel')).toContain('noopener')
  })

  it('is a 56 px circle that grows into a pill with a label on desktop', () => {
    renderButton()
    expect(link().classList.contains('size-14')).toBe(true)
    expect(screen.getByText('Chat with us')).toBeTruthy()
  })

  it('uses the template of the page it is on', () => {
    navigationState.pathname = '/services/ai-build'
    renderButton()
    expect(link().getAttribute('href')).toContain(
      encodeURIComponent("Hi Sineva, I'm interested in AI Build. Can we talk?"),
    )
  })

  it('asks about the product on the product page', () => {
    navigationState.pathname = '/products/ai-agents'
    renderButton()
    expect(link().getAttribute('href')).toContain(
      encodeURIComponent(whatsappSettings.templates.product),
    )
  })

  it.each([
    ['missing settings', null],
    ['an empty number', { ...whatsappSettings, number: '' }],
    ['an invalid number', { ...whatsappSettings, number: '0812' }],
  ])('renders nothing for %s', (_label, whatsapp) => {
    const { container } = renderButton({ whatsapp })
    expect(container.innerHTML).toBe('')
  })

  it('shows the label until the first scroll, then collapses to the icon', () => {
    renderButton()
    expect(root().getAttribute('data-collapsed')).toBe('false')
    act(() => scrollTo(40))
    expect(root().getAttribute('data-collapsed')).toBe('true')
    // The accessible name does not depend on the visible label.
    expect(link()).toBeTruthy()
  })

  it('stays collapsed after scrolling back to the top', () => {
    renderButton()
    act(() => scrollTo(40))
    act(() => scrollTo(0))
    expect(root().getAttribute('data-collapsed')).toBe('true')
  })

  it('starts collapsed when the page loads already scrolled', () => {
    scrollTo(300)
    renderButton()
    expect(root().getAttribute('data-collapsed')).toBe('true')
  })

  it('turns the breathing animation off under reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true })
    renderButton()
    expect(root().getAttribute('data-motion')).toBe('reduced')
  })

  it('keeps the breathing animation by default', () => {
    renderButton()
    expect(root().getAttribute('data-motion')).toBe('full')
  })
})
