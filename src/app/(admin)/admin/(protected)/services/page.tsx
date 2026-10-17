import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { CollectionList } from '@/features/collections/components/collection-list'
import { listServicesForAdmin } from '@/features/services/service.server'
import { reorderServicesAction } from '@/features/services/actions'
import { routing } from '@/i18n/routing'

export const metadata = { title: 'Layanan' }

export default async function ServicesAdminPage() {
  await requireCapability('content:write')
  const { items } = await listServicesForAdmin(await headers())
  const locale = routing.defaultLocale
  return (
    <main>
      <PageHeader
        title="Layanan"
        description="Layanan yang terbit tampil di menu, halaman Layanan dan pesan WhatsApp per layanan."
      />
      <CollectionList
        reorder={{ action: reorderServicesAction, fields: {} }}
        title="Daftar layanan"
        description="Urutan di sini adalah urutan di situs."
        itemLabel="Layanan"
        keyLabel="Slug"
        basePath="/admin/services"
        rows={items.map((item) => ({
          id: item.id,
          key: item.locales[locale]?.slug ?? '-',
          title: String(item.locales[locale]?.data.title ?? 'Tanpa judul'),
          isDemo: item.isDemo,
          status: item.published
            ? { label: 'Terbit', tone: 'success' }
            : { label: 'Draf', tone: 'warning' },
        }))}
      />
    </main>
  )
}
