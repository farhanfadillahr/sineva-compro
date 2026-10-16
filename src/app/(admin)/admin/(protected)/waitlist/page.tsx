import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { EmptyState } from '@/components/admin/display'
import { Badge } from '@/components/admin/primitives'
import { Pagination } from '@/components/admin/pagination'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { CONTACT_SEGMENTS } from '@/lib/contact-message'
import { listWaitlist, readWaitlistFilters } from '@/features/waitlist/service.server'
import { deleteWaitlistEntryAction } from '@/features/waitlist/actions'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Waitlist' }

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const filters = readWaitlistFilters(await searchParams)
  const result = await listWaitlist(await headers(), filters)
  const query = (extra: Record<string, string>) =>
    new URLSearchParams(
      Object.entries({
        segment: filters.segment,
        from: filters.from,
        to: filters.to,
        ...extra,
      }).filter(([, v]) => v),
    ).toString()
  if (filters.page > result.page)
    redirect(`/admin/waitlist?${query({ page: String(result.page) })}`)
  return (
    <main className={s.stack}>
      <PageHeader
        title="Waitlist"
        description={`${result.total} orang menunggu produk. Data disimpan sampai 12 bulan setelah peluncuran atau sampai diminta hapus.`}
        actions={
          <a className={s.button} href={`/admin/waitlist/export?${query({})}`}>
            Unduh CSV
          </a>
        }
      />
      <form
        className={`${s.panel} ${s.row}`}
        method="get"
        autoComplete="off"
        aria-label="Filter waitlist"
      >
        <label className={s.field}>
          Jenis bisnis
          <select name="segment" defaultValue={filters.segment}>
            <option value="">Semua</option>
            {CONTACT_SEGMENTS.map((segment) => (
              <option key={segment}>{segment}</option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          Dari
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label className={s.field}>
          Sampai
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <button className={s.button} type="submit">
          Terapkan
        </button>
      </form>
      {result.items.length === 0 ? (
        <EmptyState message="Belum ada yang bergabung." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Jenis bisnis</th>
                <th scope="col">Bergabung</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className={s.mono}>
                    {item.email} {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                  </td>
                  <td>{item.segment ?? '-'}</td>
                  <td className={s.mono}>{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                  <td>
                    <ConfirmAction
                      action={deleteWaitlistEntryAction}
                      fields={{ id: item.id }}
                      label="Hapus"
                      title="Hapus dari waitlist"
                      description="Gunakan untuk permintaan penghapusan data. Tindakan ini permanen."
                      confirmName={item.email}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        pathname="/admin/waitlist"
        query={query({ page: String(result.page), pageSize: String(result.pageSize) })}
      />
    </main>
  )
}
