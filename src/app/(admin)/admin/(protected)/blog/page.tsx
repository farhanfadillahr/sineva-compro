import Link from 'next/link'
import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listDocumentsForAdmin } from '@/features/documents/service.server'
import { DocumentList } from '@/features/documents/components/document-list'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Artikel' }

export default async function BlogAdminPage() {
  await requireCapability('content:write')
  const { items } = await listDocumentsForAdmin(await headers(), 'posts')
  return (
    <main className={s.stack}>
      <PageHeader
        title="Blog"
        description="Artikel diterbitkan per bahasa."
        actions={
          <Link className={s.button} href="/admin/blog/categories">
            Kelola kategori
          </Link>
        }
      />
      <DocumentList name="posts" items={items} />
    </main>
  )
}
