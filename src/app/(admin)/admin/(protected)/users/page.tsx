import Link from 'next/link'
import { headers } from 'next/headers'
import { db } from '@/lib/db/client.server'
import { readServerEnv } from '@/env/server'
import { requirePrincipal } from '@/features/auth/session.server'
import { listUsers } from '@/features/users/query.server'
import { readUsersPage } from '@/features/users/page-access.server'
import { UserTable } from '@/features/users/components/user-table'
export const metadata = { title: 'Pengguna' }
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[]; page?: string | string[] }>
}) {
  await requirePrincipal()
  const params = await searchParams
  const headersValue = await headers()
  const result = await readUsersPage(() =>
    listUsers(db, readServerEnv(process.env), headersValue, {
      search: params.search ?? '',
      page: params.page === undefined ? 1 : Number(params.page),
      pageSize: 20,
    }),
  )
  return (
    <main>
      <div className="users-heading">
        <div>
          <p className="eyebrow">Akses tim</p>
          <h1 className="dashboard-title">Pengguna</h1>
          <p className="muted">Kelola akun Editor dan akses ke ruang kerja.</p>
        </div>
        <Link className="button-primary" href="/admin/users/new">
          Tambah Editor
        </Link>
      </div>
      <section className="users-panel">
        <form className="users-search" action="/admin/users" method="get">
          <div className="form-field">
            <label htmlFor="user-search">Cari nama atau email</label>
            <input
              id="user-search"
              name="search"
              type="search"
              maxLength={100}
              defaultValue={typeof params.search === 'string' ? params.search : ''}
            />
          </div>
          <button className="button-secondary" type="submit">
            Cari
          </button>
        </form>
        <UserTable
          result={result}
          search={typeof params.search === 'string' ? params.search : ''}
        />
      </section>
    </main>
  )
}
