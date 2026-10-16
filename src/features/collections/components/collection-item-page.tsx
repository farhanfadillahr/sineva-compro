import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { routing } from '@/i18n/routing'
import { CmsError } from '../../cms/errors'
import { collectionConfigs, type CollectionName } from '../configs'
import { getCollectionItemForAdmin } from '../service.server'
import { CollectionEditor } from './collection-editor'

const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

/** Server page body shared by every `/<collection>/[id]` route; `new` opens an empty form. */
export async function CollectionItemPage({
  name,
  id,
  basePath,
  fieldOptions,
}: {
  name: CollectionName
  id: string
  basePath: string
  fieldOptions?: Record<string, { value: string; label: string }[]>
}) {
  const principal = await requireCapability('content:write')
  const config = collectionConfigs[name]
  let item = null
  if (id !== 'new') {
    try {
      item = (await getCollectionItemForAdmin(await headers(), name, id)).item
    } catch (error) {
      if (error instanceof CmsError && error.code === 'NOT_FOUND') notFound()
      throw error
    }
  }
  const title = item
    ? String(item.locales[routing.defaultLocale]?.[config.titleField] ?? item.key)
    : `Tambah ${config.itemLabel.toLowerCase()}`
  return (
    <main>
      <PageHeader title={title} description={config.description} meta={item?.key} />
      <CollectionEditor
        name={name}
        item={item}
        locales={routing.locales.map((code) => ({ code, label: localeLabels[code] ?? code }))}
        isAdmin={principal.role === 'admin'}
        basePath={basePath}
        fieldOptions={fieldOptions}
      />
    </main>
  )
}
