import Link from 'next/link'
import { headers } from 'next/headers'
import { db } from '@/lib/db/client.server'
import { readServerEnv } from '@/env/server'
import { requirePrincipal } from '@/features/auth/session.server'
import { listUsers } from '@/features/users/query.server'
import { readUsersPage } from '@/features/users/page-access.server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/users-table'
import { PageHeader } from '@/components/admin/shell'
import { lastPageRedirect, readTableQuery } from '@/components/admin/table-state'
import styles from '@/components/admin/admin.module.css'
export const metadata = { title: 'Pengguna' }
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requirePrincipal()
  const params = await searchParams
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') urlParams.set(key, value)
    else if (Array.isArray(value) && value[0]) urlParams.set(key, value[0])
  }
  const state = readTableQuery(urlParams)
  // The existing service permits at most 50. Keep its policy unchanged.
  if (state.pageSize === 100) state.pageSize = 20
  urlParams.set('pageSize', String(state.pageSize))
  const headersValue = await headers()
  const result = await readUsersPage(() =>
    listUsers(db, readServerEnv(process.env), headersValue, {
      search: state.search,
      page: state.page,
      pageSize: state.pageSize,
    }),
  )
  const canonical = lastPageRedirect(
    '/admin/users',
    urlParams,
    result.total,
    result.page,
    result.pageSize,
  )
  if (canonical) redirect(canonical)
  return (
    <main>
      <PageHeader
        title="Pengguna"
        description="Kelola akun Editor dan akses ke ruang kerja."
        actions={
          <Link className={`${styles.button} ${styles.primary}`} href="/admin/users/new">
            Tambah Editor
          </Link>
        }
      />
      <section className={styles.panel} aria-label="Daftar pengguna">
        <UsersTable result={result} query={urlParams.toString()} />
      </section>
    </main>
  )
}
