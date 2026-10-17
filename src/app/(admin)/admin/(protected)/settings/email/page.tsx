import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { loadEmailSettings } from '@/features/email/service.server'
import { loadSettingsForAdmin } from '@/features/settings/service.server'
import { EmailSettingsForm } from '@/features/email/components/email-settings-form'

export const metadata = { title: 'Pengaturan email' }

export default async function EmailSettingsPage() {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const requestHeaders = await headers()
  const [value, settings] = await Promise.all([
    loadEmailSettings(requestHeaders),
    loadSettingsForAdmin(requestHeaders),
  ])
  return (
    <main>
      <PageHeader
        title="Pengaturan email"
        description="Penyedia pengiriman, pengirim dan template email. Resend API disarankan untuk production."
      />
      <EmailSettingsForm
        value={value}
        inboxEmails={settings.value.global.leadRouting.inboxEmails}
      />
    </main>
  )
}
