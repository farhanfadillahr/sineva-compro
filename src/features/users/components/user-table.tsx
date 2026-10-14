import Link from 'next/link'
import type { UserPage } from '../types'
export function UserTable({ result, search }: { result: UserPage; search: string }) {
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const url = (page: number) =>
    `/admin/users?${new URLSearchParams({ search, page: String(page) })}`
  return (
    <>
      <div className="users-table-wrap">
        <table className="users-table">
          <caption className="sr-only">Daftar pengguna Sineva Tech</caption>
          <thead>
            <tr>
              <th scope="col">Pengguna</th>
              <th scope="col">Peran</th>
              <th scope="col">Status</th>
              <th scope="col">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {result.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="user-name">{u.name}</span>
                  <span className="user-email">{u.email}</span>
                </td>
                <td>{u.role === 'admin' ? 'Admin' : 'Editor'}</td>
                <td>
                  <span className="role-badge">{u.active ? 'Aktif' : 'Nonaktif'}</span>
                </td>
                <td>
                  {u.role === 'editor' ? (
                    <Link
                      className="text-link"
                      href={`/admin/users/${encodeURIComponent(u.id)}`}
                      aria-label={`Ubah ${u.name}`}
                    >
                      Ubah
                    </Link>
                  ) : (
                    <span className="muted">Hanya baca</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!result.users.length ? (
        <p className="users-empty">
          {search
            ? 'Tidak ada pengguna yang cocok. Coba kata pencarian lain.'
            : 'Belum ada pengguna. Tambahkan akun Editor untuk mulai bekerja.'}
        </p>
      ) : null}
      <nav className="users-pagination" aria-label="Halaman pengguna">
        <span className="muted">
          {result.total} pengguna · Halaman {result.page} dari {pages}
        </span>
        <div>
          {result.page > 1 ? (
            <Link className="text-link" href={url(result.page - 1)}>
              Sebelumnya
            </Link>
          ) : null}
          {result.page < pages ? (
            <Link className="text-link" href={url(result.page + 1)}>
              Berikutnya
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  )
}
