import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteFooter } from '../../src/components/layout/site-footer'
import { SiteHeader } from '../../src/components/layout/site-header'
import { createStaticContentSource } from '../../src/content/static'
import {
  fixtureSiteSettings,
  navigationState,
  navServices,
  removeMatchMedia,
  renderWithIntl,
  resetScroll,
  whatsappSettings,
} from './layout-test-utils'

vi.mock('@/i18n/navigation', async () => (await import('./layout-test-utils')).navigationMock)

beforeEach(() => {
  navigationState.pathname = '/'
  resetScroll()
  removeMatchMedia()
})

describe('the static launch has no work to show', () => {
  it('reports an empty work list, which is what hides the Work link', async () => {
    expect(await createStaticContentSource().listWork({ locale: 'en' })).toEqual([])
  })
})

describe('Work link visibility', () => {
  it('desktop nav shows Work by default and hides it with showWork={false}', () => {
    const shown = renderWithIntl(<SiteHeader services={navServices} whatsapp={whatsappSettings} />)
    const nav = () => screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav()).getByRole('link', { name: 'Work' })).toBeTruthy()
    shown.unmount()

    renderWithIntl(
      <SiteHeader services={navServices} whatsapp={whatsappSettings} showWork={false} />,
    )
    expect(within(nav()).queryByRole('link', { name: 'Work' })).toBeNull()
    // The other plain links are untouched.
    expect(within(nav()).getByRole('link', { name: 'Blog' })).toBeTruthy()
    expect(within(nav()).getByRole('link', { name: 'About' })).toBeTruthy()
  })

  it('mobile menu hides Work with showWork={false} and keeps Blog and About', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <SiteHeader services={navServices} whatsapp={whatsappSettings} showWork={false} />,
    )
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByRole('link', { name: 'Work' })).toBeNull()
    expect(within(dialog).getByRole('link', { name: 'Blog' })).toBeTruthy()
    expect(within(dialog).getByRole('link', { name: 'About' })).toBeTruthy()
  })

  it('mobile menu still shows Work by default', async () => {
    const user = userEvent.setup()
    renderWithIntl(<SiteHeader services={navServices} whatsapp={whatsappSettings} />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'Work' })).toBeTruthy()
  })

  it('footer shows Work by default and hides it with showWork={false}', () => {
    const shown = renderWithIntl(
      <SiteFooter settings={fixtureSiteSettings} services={navServices} />,
    )
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Work' })).toBeTruthy()
    shown.unmount()

    renderWithIntl(
      <SiteFooter settings={fixtureSiteSettings} services={navServices} showWork={false} />,
    )
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).queryByRole('link', { name: 'Work' })).toBeNull()
    expect(within(footer).getByRole('link', { name: 'Blog' })).toBeTruthy()
    expect(within(footer).getByRole('link', { name: 'About' })).toBeTruthy()
  })
})

describe('footer contact without a public email', () => {
  it('renders no mailto link and no empty address block when email and the rest are null', () => {
    renderWithIntl(
      <SiteFooter
        settings={{
          contact: { email: null, businessHours: null, address: null, legalEntity: null },
          social: { instagram: null, linkedin: null, tiktok: null, youtube: null, x: null },
        }}
        services={navServices}
      />,
    )
    const footer = screen.getByRole('contentinfo')
    expect(footer.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(footer.querySelector('address')).toBeNull()
  })

  it('still renders the mailto link when an email exists', () => {
    renderWithIntl(<SiteFooter settings={fixtureSiteSettings} services={navServices} />)
    const footer = screen.getByRole('contentinfo')
    expect(
      footer.querySelector(`a[href="mailto:${fixtureSiteSettings.contact.email}"]`),
    ).not.toBeNull()
  })
})
