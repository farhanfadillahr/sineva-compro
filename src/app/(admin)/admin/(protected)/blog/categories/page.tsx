import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listCollectionForAdmin } from '@/features/collections/service.server'
import { CollectionList } from '@/features/collections/components/collection-list'
import { reorderCollectionAction } from '@/features/collections/actions'
import { categoriesConfig } from '@/features/collections/configs'
import { routing } from '@/i18n/routing'

export const metadata = { title: 'Kategori' }

export default async function CategoriesAdminPage() {
  await requireCapability('content:write')
  const { items } = await listCollectionForAdmin(await headers(), 'categories')
  return (
    <main>
      <PageHeader title={categoriesConfig.title} description={categoriesConfig.description} />
      <CollectionList
        reorder={{ action: reorderCollectionAction, fields: { collection: 'categories' } }}
        title="Kategori"
        description="Urutan ini dipakai pada filter blog."
        itemLabel={categoriesConfig.itemLabel}
        keyLabel="Slug"
        basePath="/admin/blog/categories"
        rows={items.map((item) => ({
          id: item.id,
          key: item.key,
          title: String(item.locales[routing.defaultLocale]?.name ?? item.key),
          isDemo: item.isDemo,
        }))}
      />
    </main>
  )
}
