'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserPage, UserSummary } from '@/features/users/types'
import { DataTable, type AdminColumn } from './data-table'
import { Badge } from './primitives'
import { Avatar } from './display'
import s from './admin.module.css'
const columns: AdminColumn<UserSummary>[] = [
  {
    id: 'name',
    label: 'Pengguna',
    cell: (u) => (
      <div className={s.row}>
        <Avatar name={u.name} />
        <div>
          <span>{u.name}</span>
          <div className={s.muted}>{u.email}</div>
        </div>
      </div>
    ),
  },
  { id: 'role', label: 'Peran', cell: (u) => (u.role === 'admin' ? 'Admin' : 'Editor') },
  {
    id: 'active',
    label: 'Status',
    cell: (u) => (
      <Badge tone={u.active ? 'success' : 'brand'}>{u.active ? 'Aktif' : 'Nonaktif'}</Badge>
    ),
  },
  {
    id: 'actions',
    label: 'Tindakan',
    cell: (u) =>
      u.role === 'editor' ? (
        <Link href={`/admin/users/${encodeURIComponent(u.id)}`} aria-label={`Ubah ${u.name}`}>
          Ubah
        </Link>
      ) : (
        <span className={s.muted}>Hanya baca</span>
      ),
  },
]
export function UsersTable({ result, query }: { result: UserPage; query: string }) {
  const router = useRouter()
  return (
    <DataTable
      label="pengguna"
      rows={result.users}
      columns={columns}
      total={result.total}
      pathname="/admin/users"
      query={query}
      pageSizes={[20, 50]}
      onNavigate={(url) => router.push(url, { scroll: false })}
    />
  )
}
