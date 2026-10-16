import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listCollectionForAdmin } from '@/features/collections/service.server'
import { CollectionList } from '@/features/collections/components/collection-list'
import { reorderCollectionAction } from '@/features/collections/actions'
import { teamConfig } from '@/features/collections/configs'
import { routing } from '@/i18n/routing'

export const metadata = { title: 'Tim' }

export default async function TeamAdminPage() {
  await requireCapability('content:write')
  const { items } = await listCollectionForAdmin(await headers(), 'team')
  return (
    <main>
      <PageHeader title={teamConfig.title} description={teamConfig.description} />
      <CollectionList
        reorder={{ action: reorderCollectionAction, fields: { collection: 'team' } }}
        title="Anggota"
        description="Urutan ini dipakai di halaman Tentang."
        itemLabel={teamConfig.itemLabel}
        basePath="/admin/team"
        rows={items.map((item) => ({
          id: item.id,
          key: item.key,
          title: String(item.global.name ?? item.key),
          isDemo: item.isDemo,
          meta: String(item.locales[routing.defaultLocale]?.role ?? ''),
          status: item.global.showOnAbout
            ? { label: 'Di Tentang', tone: 'success' }
            : { label: 'Tersembunyi', tone: 'warning' },
        }))}
      />
    </main>
  )
}
