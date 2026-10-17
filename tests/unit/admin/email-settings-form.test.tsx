import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { EmailSettingsView } from '../../../src/features/email/service.server'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }))
vi.mock('../../../src/features/email/actions', () => ({
  saveEmailSettingsAction: vi.fn(),
  sendTestEmailAction: vi.fn(),
}))

const { EmailSettingsForm } =
  await import('../../../src/features/email/components/email-settings-form')

const template = { subject: 'Subject', body: 'Body' }
const view = (overrides: Partial<EmailSettingsView>): EmailSettingsView => ({
  mode: 'resend-api',
  smtpHost: '',
  smtpPort: 587,
  smtpSecurity: 'starttls',
  smtpUsername: '',
  fromName: 'Sineva',
  fromEmail: 'support@sineva.id',
  replyTo: '',
  hasSecret: false,
  managedByEnvironment: false,
  templates: {
    en: {
      'lead-notification': template,
      'lead-auto-reply': template,
      'waitlist-confirmation': template,
    },
  },
  ...overrides,
})

afterEach(cleanup)

// CPR-115: the Founder could not tell whether to type the Resend key into the admin as well.
describe('email settings secret field', () => {
  it('asks for the API key when the environment does not provide one', () => {
    render(<EmailSettingsForm value={view({})} inboxEmails={[]} />)
    expect(screen.getByLabelText('API key Resend')).toBeTruthy()
  })

  it('hides the key field and says where the key comes from when the environment manages it', () => {
    render(
      <EmailSettingsForm
        value={view({ managedByEnvironment: 'resend-api', hasSecret: true })}
        inboxEmails={[]}
      />,
    )
    expect(screen.queryByLabelText('API key Resend')).toBeNull()
    expect(screen.queryByText('Hapus rahasia tersimpan')).toBeNull()
    expect(screen.getByText(/diambil dari environment Vercel/)).toBeTruthy()
    expect(screen.getByLabelText('Email pengirim')).toBeTruthy()
  })
})
