import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { InlineBanner } from '@/components/admin/feedback'
import { routing } from '@/i18n/routing'
import { loadSettingsForAdmin } from '@/features/settings/service.server'
import { SettingsForm } from '@/features/settings/components/settings-form'

export const metadata = { title: 'Pengaturan situs' }

const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

export default async function SettingsPage() {
  await requireCapability('content:write')
  const { actor, value, services, seeded } = await loadSettingsForAdmin(await headers())
  return (
    <main>
      <PageHeader
        title="Pengaturan situs"
        description={
          actor.role === 'admin'
            ? 'Brand, kontak, WhatsApp, media sosial, penerusan lead, fitur, analitik dan verifikasi.'
            : 'Editor dapat mengubah kontak, template WhatsApp dan media sosial.'
        }
      />
      {!seeded ? (
        <InlineBanner tone="warning">
          Pengaturan belum tersimpan di database. Nilai di bawah berasal dari konten peluncuran;
          simpan sekali untuk membuatnya.
        </InlineBanner>
      ) : null}
      <SettingsForm
        value={value}
        isAdmin={actor.role === 'admin'}
        services={services}
        locales={routing.locales.map((code) => ({ code, label: localeLabels[code] ?? code }))}
      />
    </main>
  )
}
