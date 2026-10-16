import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader, SectionHeader } from '@/components/admin/shell'
import { EmptyState } from '@/components/admin/display'
import { Badge } from '@/components/admin/primitives'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { listRedirectsForAdmin } from '@/features/redirects/service.server'
import { deleteRedirectAction } from '@/features/redirects/actions'
import { RedirectForm } from '@/features/redirects/components/redirect-form'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Redirect' }

export default async function RedirectsPage() {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const { items } = await listRedirectsForAdmin(await headers())
  return (
    <main className={s.stack}>
      <PageHeader
        title="Redirect"
        description="Redirect dibuat otomatis saat slug yang terbit berubah. Putaran dan rantai panjang ditolak."
      />
      <RedirectForm />
      <SectionHeader title="Daftar redirect" />
      {items.length === 0 ? (
        <EmptyState message="Belum ada redirect." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Dari</th>
                <th scope="col">Ke</th>
                <th scope="col">Status</th>
                <th scope="col">Sumber</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={s.mono}>{item.fromPath}</td>
                  <td className={s.mono}>{item.toPath}</td>
                  <td>{item.status}</td>
                  <td>
                    <Badge tone={item.source === 'auto' ? 'brand' : 'success'}>
                      {item.source === 'auto' ? 'Otomatis' : 'Manual'}
                    </Badge>
                  </td>
                  <td>
                    <ConfirmAction
                      action={deleteRedirectAction}
                      fields={{ id: item.id }}
                      label="Hapus"
                      title="Hapus redirect"
                      description={`Alamat ${item.fromPath} tidak lagi diarahkan.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
