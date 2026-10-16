import Link from 'next/link'
import type { listAuditLog } from '../query.server'
import { auditFields, auditPageHref } from '../input'

const actions: Record<string, string> = {
  create: 'Buat',
  update: 'Ubah',
  delete: 'Hapus',
  publish: 'Terbitkan',
  unpublish: 'Batalkan terbit',
  activate: 'Aktifkan',
  deactivate: 'Nonaktifkan',
  password_change: 'Ganti kata sandi',
}
const entities: Record<string, string> = {
  users: 'Pengguna',
  profile: 'Profil',
  media: 'Media',
  services: 'Layanan',
  pages: 'Halaman',
  settings: 'Pengaturan situs',
  email_settings: 'Pengaturan email',
  redirects: 'Redirect',
  leads: 'Lead',
  waitlist: 'Waitlist',
  posts: 'Artikel',
  portfolio: 'Karya',
  team: 'Tim',
  faq: 'FAQ',
  product: 'Produk',
  categories: 'Kategori',
}
const date = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})
export function AuditView({ result }: { result: Awaited<ReturnType<typeof listAuditLog>> }) {
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const href = (page: number) => auditPageHref({ ...result, page })
  return (
    <main>
      <div className="users-heading">
        <div>
          <p className="eyebrow">Sistem</p>
          <h1 className="dashboard-title">Log audit</h1>
          <p className="muted">
            Riwayat perubahan admin. Hanya nama field yang dicatat, tanpa nilai data.
          </p>
        </div>
      </div>
      <section className="users-panel" aria-label="Aktivitas admin">
        <form className="users-search" action="/admin/audit" method="get">
          <div className="form-field">
            <label htmlFor="audit-actor">ID pelaku</label>
            <input
              id="audit-actor"
              name="actor"
              maxLength={128}
              defaultValue={result.actor}
              aria-describedby="audit-actor-help"
            />
          </div>
          <div className="form-field">
            <label htmlFor="audit-entity">Entitas</label>
            <select id="audit-entity" name="entity" defaultValue={result.entity}>
              <option value="">Semua entitas</option>
              {Object.keys(auditFields).map((key) => (
                <option key={key} value={key}>
                  {entities[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="audit-size">Baris per halaman</label>
            <select id="audit-size" name="pageSize" defaultValue={result.pageSize}>
              {[...new Set([20, 50, 100, result.pageSize])]
                .sort((a, b) => a - b)
                .map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
            </select>
          </div>
          <button className="button-secondary" type="submit">
            Terapkan filter
          </button>
          <Link className="button-secondary" href="/admin/audit">
            Reset filter
          </Link>
        </form>
        <p className="muted" id="audit-actor-help">
          Salin ID pelaku dari tabel untuk memfilter riwayatnya.
        </p>
        <div className="users-table-wrap">
          <table className="users-table">
            <caption className="sr-only">Riwayat perubahan admin</caption>
            <thead>
              <tr>
                <th scope="col">Waktu (WIB)</th>
                <th scope="col">Pelaku</th>
                <th scope="col">Entitas</th>
                <th scope="col">ID entitas</th>
                <th scope="col">Tindakan</th>
                <th scope="col">Field berubah</th>
              </tr>
            </thead>
            <tbody>
              {result.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <time dateTime={entry.createdAt.toISOString()}>
                      {date.format(entry.createdAt)}
                    </time>
                  </td>
                  <td>
                    <span className="user-name">{entry.actorName ?? 'Akun telah dihapus'}</span>
                    {entry.actorId ? <code>{entry.actorId}</code> : null}
                  </td>
                  <td>{entities[entry.entity] ?? entry.entity}</td>
                  <td>
                    <code>{entry.entityId}</code>
                  </td>
                  <td>{actions[entry.action] ?? entry.action}</td>
                  <td>{entry.changedFields.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!result.entries.length ? (
          <p className="users-empty">Belum ada aktivitas yang cocok dengan filter.</p>
        ) : null}
        <nav className="users-pagination" aria-label="Halaman log audit">
          <span className="muted">
            Menampilkan {result.total ? (result.page - 1) * result.pageSize + 1 : 0}-
            {Math.min(result.page * result.pageSize, result.total)} dari {result.total}
          </span>
          <span>
            Halaman {result.page} dari {pages}
          </span>
          <div>
            {result.page > 1 ? (
              <Link
                className="text-link"
                href={href(result.page - 1)}
                aria-label="Halaman sebelumnya"
              >
                Sebelumnya
              </Link>
            ) : null}
            {result.page < pages ? (
              <Link
                className="text-link"
                href={href(result.page + 1)}
                aria-label="Halaman berikutnya"
              >
                Berikutnya
              </Link>
            ) : null}
          </div>
        </nav>
      </section>
    </main>
  )
}
