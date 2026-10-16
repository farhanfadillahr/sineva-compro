import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FOOTER_ACCORDION_QUERY } from '../../src/components/layout/media-queries'
import { SiteFooter } from '../../src/components/layout/site-footer'
import {
  fixtureSiteSettings,
  installMatchMedia,
  navServices,
  removeMatchMedia,
  renderWithIntl,
} from './layout-test-utils'

vi.mock('@/i18n/navigation', async () => (await import('./layout-test-utils')).navigationMock)

type Settings = Parameters<typeof SiteFooter>[0]['settings']

const filledSettings = {
  contact: {
    ...fixtureSiteSettings.contact,
    address: 'Jl. Contoh No. 1, Jakarta',
    legalEntity: { name: 'PT Contoh Sineva', registrationNumber: '1234567890' },
  },
  social: {
    instagram: 'https://example.com/social/instagram',
    linkedin: 'https://example.com/social/linkedin',
    tiktok: 'https://example.com/social/tiktok',
    youtube: 'https://example.com/social/youtube',
    x: 'https://example.com/social/x',
  },
} satisfies Settings

function renderFooter(settings: Settings = fixtureSiteSettings) {
  return renderWithIntl(<SiteFooter settings={settings} services={navServices} />)
}

beforeEach(() => {
  removeMatchMedia()
})

describe('SiteFooter columns', () => {
  it('has the four columns with their links', () => {
    renderFooter()
    const footer = screen.getByRole('contentinfo')
    const column = (name: string) =>
      within(footer).getByRole('heading', { name }).closest('section') as HTMLElement

    const product = within(column('Product'))
    expect(product.getByRole('link', { name: 'AI Agents' }).getAttribute('href')).toBe(
      '/products/ai-agents',
    )
    expect(product.getByRole('link', { name: 'Join the waitlist' })).toBeTruthy()

    const services = within(column('Services'))
    expect(services.getByRole('link', { name: 'AI Discovery' }).getAttribute('href')).toBe(
      '/services/ai-discovery',
    )
    expect(services.getByRole('link', { name: 'AI Build' })).toBeTruthy()
    expect(services.getByRole('link', { name: 'AI Enablement' })).toBeTruthy()
    expect(services.getByRole('link', { name: 'All services' }).getAttribute('href')).toBe(
      '/services',
    )

    const company = within(column('Company'))
    expect(company.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about')
    expect(company.getByRole('link', { name: 'Work' }).getAttribute('href')).toBe('/work')
    expect(company.getByRole('link', { name: 'Blog' }).getAttribute('href')).toBe('/blog')
    expect(company.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/contact')

    const legal = within(column('Legal'))
    expect(legal.getByRole('link', { name: 'Privacy policy' }).getAttribute('href')).toBe(
      '/privacy-policy',
    )
  })

  it('still renders with only the all-services link when there are no services', () => {
    renderWithIntl(<SiteFooter settings={fixtureSiteSettings} services={[]} />)
    expect(screen.getByRole('link', { name: 'All services' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'AI Discovery' })).toBeNull()
  })

  it('renders without site settings', () => {
    renderFooter(null)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /^Sineva on / })).toBeNull()
  })

  it('shows the copyright line in the mono font', () => {
    renderFooter()
    const line = screen.getByText('© 2026 Sineva')
    expect(line.classList.contains('font-mono')).toBe(true)
  })

  it('shows the symbol logo as a link home', () => {
    renderFooter()
    const home = within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Sineva home' })
    expect(home.getAttribute('href')).toBe('/')
    // Symbol only: the wordmark text lives in the watermark, not next to the symbol.
    expect(within(home).queryByText('Sineva')).toBeNull()
  })

  it('has a decorative wordmark watermark hidden from assistive technology', () => {
    renderFooter()
    const watermark = document.querySelector('[data-slot="footer-watermark"]')
    expect(watermark?.getAttribute('aria-hidden')).toBe('true')
    expect(watermark?.textContent).toBe('Sineva')
  })

  it('layers the wordmark behind the navigation instead of below it', () => {
    renderFooter()
    const watermark = document.querySelector('[data-slot="footer-watermark"]') as HTMLElement
    const content = document.querySelector('[data-slot="footer-content"]') as HTMLElement
    // Out of flow and underneath: the footer's height comes from the navigation alone, and the
    // navigation (with the bottom bar) stays the last thing in the flow.
    expect(watermark.className).toMatch(/\babsolute\b/)
    expect(watermark.className).toMatch(/\bz-0\b/)
    expect(content.className).toMatch(/\brelative\b/)
    expect(content.className).toMatch(/\bz-10\b/)
  })
})

describe('SiteFooter site settings', () => {
  it('shows social icons only for accounts that exist', () => {
    renderFooter()
    // The fixture has Instagram and LinkedIn; TikTok, YouTube and X are null.
    expect(screen.getByRole('link', { name: 'Sineva on Instagram' }).getAttribute('href')).toBe(
      fixtureSiteSettings.social.instagram,
    )
    expect(screen.getByRole('link', { name: 'Sineva on LinkedIn' })).toBeTruthy()
    for (const name of ['TikTok', 'YouTube', 'X']) {
      expect(screen.queryByRole('link', { name: `Sineva on ${name}` })).toBeNull()
    }
  })

  it('opens social links in a new tab without leaking the opener', () => {
    renderFooter()
    const link = screen.getByRole('link', { name: 'Sineva on Instagram' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('shows every social icon when every account exists', () => {
    renderFooter(filledSettings)
    for (const name of ['Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'X']) {
      expect(screen.getByRole('link', { name: `Sineva on ${name}` })).toBeTruthy()
    }
  })

  it('renders no social list at all when no account exists', () => {
    renderFooter({
      ...filledSettings,
      social: { instagram: null, linkedin: null, tiktok: null, youtube: null, x: null },
    })
    expect(screen.queryByRole('list', { name: 'Social media' })).toBeNull()
  })

  it('hides the address and legal lines while they are empty in site settings', () => {
    renderFooter()
    expect(fixtureSiteSettings.contact.address).toBeNull()
    expect(fixtureSiteSettings.contact.legalEntity).toBeNull()
    expect(document.querySelector('address')?.textContent).not.toMatch(/Jl\. /)
    expect(screen.queryByText(/Registration number/)).toBeNull()
    expect(document.querySelector('[data-slot="footer-address"]')).toBeNull()
    expect(document.querySelector('[data-slot="footer-legal"]')).toBeNull()
  })

  it('shows the address and legal lines once they are filled', () => {
    renderFooter(filledSettings)
    expect(document.querySelector('[data-slot="footer-address"]')?.textContent).toBe(
      'Jl. Contoh No. 1, Jakarta',
    )
    const legal = document.querySelector('[data-slot="footer-legal"]')
    expect(legal?.textContent).toContain('PT Contoh Sineva')
    expect(legal?.textContent).toContain('Registration number 1234567890')
  })

  it('shows the legal entity name alone when it has no registration number', () => {
    renderFooter({
      ...filledSettings,
      contact: {
        ...filledSettings.contact,
        legalEntity: { name: 'PT Contoh Sineva', registrationNumber: null },
      },
    })
    const legal = document.querySelector('[data-slot="footer-legal"]')
    expect(legal?.textContent).toBe('PT Contoh Sineva')
  })

  it('links the contact email and shows business hours only when set', () => {
    renderFooter()
    expect(
      screen.getByRole('link', { name: fixtureSiteSettings.contact.email! }).getAttribute('href'),
    ).toBe(`mailto:${fixtureSiteSettings.contact.email}`)
    expect(screen.getByText(fixtureSiteSettings.contact.businessHours!)).toBeTruthy()
  })

  it('hides the business hours when null', () => {
    renderFooter({
      ...filledSettings,
      contact: { ...filledSettings.contact, businessHours: null },
    })
    expect(screen.queryByText(/Monday to Friday/)).toBeNull()
  })
})

describe('SiteFooter on mobile', () => {
  it('turns columns into accordions below 768 px', async () => {
    installMatchMedia({ [FOOTER_ACCORDION_QUERY]: true })
    const user = userEvent.setup()
    renderFooter()
    const toggle = screen.getByRole('button', { name: 'Services' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    // Collapsed links are inert and hidden from assistive technology.
    expect(screen.queryByRole('link', { name: 'AI Build' })).toBeNull()

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('link', { name: 'AI Build' })).toBeTruthy()

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens several columns independently', async () => {
    installMatchMedia({ [FOOTER_ACCORDION_QUERY]: true })
    const user = userEvent.setup()
    renderFooter()
    await user.click(screen.getByRole('button', { name: 'Company' }))
    await user.click(screen.getByRole('button', { name: 'Legal' }))
    expect(screen.getByRole('button', { name: 'Company' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: 'Legal' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('shows plain headings and no accordion buttons from 768 px up', () => {
    installMatchMedia({ [FOOTER_ACCORDION_QUERY]: false })
    renderFooter()
    expect(screen.queryByRole('button', { name: 'Services' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Services' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'AI Build' })).toBeTruthy()
  })
})
