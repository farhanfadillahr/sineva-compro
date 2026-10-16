import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clampPanelX } from '../../src/components/layout/panel-position'
import { SiteHeader } from '../../src/components/layout/site-header'
import {
  navigationState,
  navServices,
  removeMatchMedia,
  renderWithIntl,
  resetScroll,
  whatsappSettings,
} from './layout-test-utils'

vi.mock('@/i18n/navigation', async () => (await import('./layout-test-utils')).navigationMock)

describe('dropdown panel position', () => {
  it('keeps the panel inside the container gutter when the trigger is near the left edge', () => {
    // Product trigger centred near x=190 of a 1348 px container with a 32 px gutter.
    expect(
      clampPanelX({ centred: -100, rootWidth: 1348, width: 592, padLeft: 32, padRight: 32 }),
    ).toBe(32)
  })

  it('keeps the panel inside the right gutter', () => {
    expect(
      clampPanelX({ centred: 900, rootWidth: 1348, width: 592, padLeft: 32, padRight: 32 }),
    ).toBe(1348 - 32 - 592)
  })

  it('keeps the centred position when it already fits', () => {
    expect(
      clampPanelX({ centred: 300, rootWidth: 1348, width: 592, padLeft: 32, padRight: 32 }),
    ).toBe(300)
  })

  it('pins to the left gutter when the panel is wider than the content box', () => {
    expect(
      clampPanelX({ centred: -50, rootWidth: 500, width: 592, padLeft: 16, padRight: 16 }),
    ).toBe(16)
  })
})

describe('mobile menu action bar', () => {
  beforeEach(() => {
    navigationState.pathname = '/'
    resetScroll()
    removeMatchMedia()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  it('does not let the stacked action buttons grow from a zero basis (they collapsed on mobile)', async () => {
    renderWithIntl(<SiteHeader services={navServices} whatsapp={whatsappSettings} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    const consult = dialog.querySelector('a[href="/contact"][data-size="lg"]')
    expect(consult).not.toBeNull()
    const classes = (consult as HTMLElement).className.split(/\s+/)
    // flex-1 in a flex-col bar sets flex-basis 0 and collapses the h-13 button; only the row
    // layout from the sm breakpoint may share the width.
    expect(classes).not.toContain('flex-1')
    expect(classes).toContain('sm:flex-1')
  })
})
