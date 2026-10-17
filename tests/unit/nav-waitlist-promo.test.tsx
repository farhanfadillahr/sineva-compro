import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
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

beforeEach(() => {
  navigationState.pathname = '/'
  resetScroll()
  removeMatchMedia()
})

// CPR-106: the Product menu kept its "Join the waitlist" card after the product went live.
it('shows the waitlist card in the mobile Product menu only while the product is coming soon', async () => {
  const user = userEvent.setup()
  const shown = renderWithIntl(<SiteHeader services={navServices} whatsapp={whatsappSettings} />)
  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  await user.click(screen.getAllByRole('button', { name: /Product/ }).at(-1)!)
  expect(screen.getAllByText('Join the waitlist').length).toBeGreaterThan(0)
  shown.unmount()

  renderWithIntl(
    <SiteHeader services={navServices} whatsapp={whatsappSettings} showWaitlist={false} />,
  )
  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  await user.click(screen.getAllByRole('button', { name: /Product/ }).at(-1)!)
  expect(screen.queryByText('Join the waitlist')).toBeNull()
})
