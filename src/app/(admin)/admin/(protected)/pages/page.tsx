import Link from 'next/link'
import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { Badge } from '@/components/admin/primitives'
import { listPagesForAdmin } from '@/features/pages/service.server'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Halaman' }

export default async function PagesPage() {
  await requireCapability('content:write')
  const pages = await listPagesForAdmin(await headers())
  return (
    <main>
      <PageHeader
        title="Halaman"
        description="Susunan bagian halaman diatur di kode. Di sini Anda mengubah isi tiap bagian."
      />
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Halaman</th>
              <th scope="col">Status per bahasa</th>
              <th scope="col">Terakhir diubah</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>
                  <Link href={`/admin/pages/${page.id}`}>{page.label}</Link>
                </td>
                <td>
                  <div className={s.row}>
                    {page.locales.map((l) => (
                      <Badge
                        key={l.locale}
                        tone={!l.stored ? 'warning' : l.complete ? 'success' : 'danger'}
                      >
                        {l.locale.toUpperCase()}{' '}
                        {!l.stored ? 'belum disimpan' : l.complete ? 'lengkap' : 'belum lengkap'}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className={s.mono}>
                  {page.locales
                    .map((l) => (l.updatedAt ? new Date(l.updatedAt).toLocaleString('id-ID') : '-'))
                    .join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
