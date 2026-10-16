import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { routing } from '@/i18n/routing'
import { CmsError } from '../../cms/errors'
import { documentConfigs, type DocumentItem, type DocumentName } from '../configs'
import { getDocumentForAdmin } from '../service.server'
import { DocumentEditor } from './document-editor'

const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

export async function DocumentPage({
  name,
  id,
  fieldOptions,
}: {
  name: DocumentName
  id: string
  fieldOptions: Record<string, { value: string; label: string }[]>
}) {
  const principal = await requireCapability('content:write')
  const config = documentConfigs[name]
  let item: DocumentItem | null = null
  if (id !== 'new') {
    try {
      item = (await getDocumentForAdmin(await headers(), name, id)).item
    } catch (error) {
      if (error instanceof CmsError && error.code === 'NOT_FOUND') notFound()
      throw error
    }
  }
  const local = item?.locales[routing.defaultLocale]
  return (
    <main>
      <PageHeader
        title={
          item
            ? String(local?.draft.title || 'Tanpa judul')
            : `Tambah ${config.itemLabel.toLowerCase()}`
        }
        description={config.description}
      />
      <DocumentEditor
        name={name}
        item={item}
        locales={routing.locales.map((code) => ({ code, label: localeLabels[code] ?? code }))}
        isAdmin={principal.role === 'admin'}
        fieldOptions={fieldOptions}
      />
    </main>
  )
}
