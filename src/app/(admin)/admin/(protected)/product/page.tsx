import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listCollectionForAdmin } from '@/features/collections/service.server'
import { CollectionList } from '@/features/collections/components/collection-list'
import { businessTypesConfig, capabilitiesConfig } from '@/features/collections/configs'
import { readProductStatus } from '@/features/product/service.server'
import { ProductStatusForm } from '@/features/product/components/product-status-form'
import { routing } from '@/i18n/routing'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Produk' }

const titleOf = (
  item: { key: string; locales: Record<string, Record<string, unknown> | undefined> },
  field: string,
) => String(item.locales[routing.defaultLocale]?.[field] ?? item.key)

export default async function ProductAdminPage() {
  await requireCapability('content:write')
  const requestHeaders = await headers()
  const [capabilities, businessTypes, status] = await Promise.all([
    listCollectionForAdmin(requestHeaders, 'capabilities'),
    listCollectionForAdmin(requestHeaders, 'businessTypes'),
    readProductStatus(),
  ])
  return (
    <main className={s.stack}>
      <PageHeader
        title="Produk"
        description="Status peluncuran, kemampuan Sino dan jenis bisnis untuk halaman Produk dan Beranda."
      />
      <ProductStatusForm status={status} />
      <CollectionList
        name="capabilities"
        title={capabilitiesConfig.title}
        description={capabilitiesConfig.description}
        itemLabel={capabilitiesConfig.itemLabel}
        basePath="/admin/product/capabilities"
        rows={capabilities.items.map((item) => ({
          id: item.id,
          key: item.key,
          title: titleOf(item, capabilitiesConfig.titleField),
          isDemo: item.isDemo,
          meta: item.global.featured ? 'Unggulan' : undefined,
        }))}
      />
      <CollectionList
        name="businessTypes"
        title={businessTypesConfig.title}
        description={businessTypesConfig.description}
        itemLabel={businessTypesConfig.itemLabel}
        basePath="/admin/product/business-types"
        rows={businessTypes.items.map((item) => ({
          id: item.id,
          key: item.key,
          title: titleOf(item, businessTypesConfig.titleField),
          isDemo: item.isDemo,
        }))}
      />
    </main>
  )
}
