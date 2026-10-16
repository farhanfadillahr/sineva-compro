import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listDocumentsForAdmin } from '@/features/documents/service.server'
import { DocumentList } from '@/features/documents/components/document-list'

export const metadata = { title: 'Karya' }

export default async function WorkAdminPage() {
  await requireCapability('content:write')
  const { items } = await listDocumentsForAdmin(await headers(), 'work')
  return (
    <main>
      <PageHeader
        title="Karya"
        description="Halaman Karya dan tautannya muncul otomatis setelah ada karya yang terbit."
      />
      <DocumentList name="work" items={items} />
    </main>
  )
}
