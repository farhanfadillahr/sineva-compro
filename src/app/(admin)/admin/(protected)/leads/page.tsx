import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { EmptyState } from '@/components/admin/display'
import { Badge } from '@/components/admin/primitives'
import { Pagination } from '@/components/admin/pagination'
import { CONTACT_INTERESTS, CONTACT_SEGMENTS } from '@/lib/contact-message'
import { LEAD_STATUSES } from '@/features/leads/schema'
import { LEAD_STATUS_LABELS, listLeads, readLeadFilters } from '@/features/leads/admin.server'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Lead' }

const tones = {
  new: 'brand',
  contacted: 'warning',
  qualified: 'success',
  won: 'success',
  lost: 'danger',
} as const

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const filters = readLeadFilters(await searchParams)
  const result = await listLeads(await headers(), filters)
  const query = (page: number) =>
    `/admin/leads?${new URLSearchParams(
      Object.entries({ ...filters, page: String(page), pageSize: String(filters.pageSize) }).filter(
        ([, v]) => v,
      ) as [string, string][],
    )}`
  if (filters.page > result.page) redirect(query(result.page))
  return (
    <main className={s.stack}>
      <PageHeader
        title="Lead"
        description="Pesan dari formulir kontak. Hanya Admin yang dapat melihat data ini. Lead dihapus otomatis 24 bulan setelah kontak terakhir, sesuai kebijakan privasi."
        actions={
          // Same filters as the list. The file holds personal data: delete it after use.
          <a
            className={s.button}
            href={`/admin/leads/export?${query(1).split('?')[1] ?? ''}`}
            download
          >
            Ekspor CSV
          </a>
        }
      />
      <form
        className={`${s.panel} ${s.filterGrid}`}
        method="get"
        autoComplete="off"
        aria-label="Filter lead"
      >
        <label className={s.field}>
          Cari
          <input
            type="search"
            name="search"
            defaultValue={filters.search}
            maxLength={100}
            placeholder="Nama, email, perusahaan atau WhatsApp"
          />
        </label>
        <label className={s.field}>
          Status
          <select name="status" defaultValue={filters.status}>
            <option value="">Semua</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          Kebutuhan
          <select name="interest" defaultValue={filters.interest}>
            <option value="">Semua</option>
            {CONTACT_INTERESTS.map((interest) => (
              <option key={interest}>{interest}</option>
            ))}
          </select>
        </label>
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
        <EmptyState message="Belum ada lead yang cocok dengan filter ini." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Nama</th>
                <th scope="col">Kebutuhan</th>
                <th scope="col">Jenis bisnis</th>
                <th scope="col">Status</th>
                <th scope="col">Masuk</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className={s.rowLink} href={`/admin/leads/${item.id}`}>
                      {item.name}
                    </Link>
                    {item.company ? <span className={s.muted}> · {item.company}</span> : null}{' '}
                    {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                  </td>
                  <td>{item.interest}</td>
                  <td>{item.segment}</td>
                  <td>
                    <Badge tone={tones[item.status as keyof typeof tones] ?? 'brand'}>
                      {LEAD_STATUS_LABELS[item.status as keyof typeof LEAD_STATUS_LABELS] ??
                        item.status}
                    </Badge>
                  </td>
                  <td className={s.mono}>{new Date(item.createdAt).toLocaleString('id-ID')}</td>
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
        pathname="/admin/leads"
        query={query(result.page).split('?')[1] ?? ''}
      />
    </main>
  )
}
