import { can } from '@/features/auth/authorization'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { requirePrincipal } from '@/features/auth/session.server'
import { LogoutButton } from '@/features/auth/components/logout-button'

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePrincipal()
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/admin" className="brand">
          <Image src="/brand/sineva-symbol-original.svg" alt="" width={36} height={36} />
          <span>
            Sineva Tech <span className="brand-caption">Admin</span>
          </span>
        </Link>
        <nav aria-label="Navigasi admin">
          {can(principal, 'users:manage') ? (
            <Link href="/admin/users" className="text-link">
              Pengguna
            </Link>
          ) : null}
          <Link href="/" className="text-link">
            Lihat website <span aria-hidden="true">↗</span>
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <div className="admin-content">{children}</div>
    </div>
  )
}
