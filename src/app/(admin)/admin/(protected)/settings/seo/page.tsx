import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { routing } from '@/i18n/routing'
import { loadSettingsForAdmin } from '@/features/settings/service.server'
import { SeoSettingsForm } from '@/features/settings/components/seo-settings-form'

export const metadata = { title: 'Pengaturan SEO' }
const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

export default async function SeoSettingsPage() {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const { value } = await loadSettingsForAdmin(await headers())
  return (
    <main>
      <PageHeader
        title="Pengaturan SEO"
        description="Template judul, deskripsi bawaan, izin indeks dan token Search Console."
      />
      <SeoSettingsForm
        value={value}
        locales={routing.locales.map((code) => ({ code, label: localeLabels[code] ?? code }))}
        organization={{
          name: value.global.brand.siteName,
          sameAs: Object.values(value.global.social).filter((v): v is string => !!v),
        }}
      />
    </main>
  )
}
