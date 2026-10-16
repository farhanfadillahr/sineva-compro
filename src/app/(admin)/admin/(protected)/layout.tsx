import type { ReactNode } from 'react'
import { requirePrincipal } from '@/features/auth/session.server'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { AdminShell } from '@/components/admin/shell'
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePrincipal()
  return (
    <AdminShell principal={principal} logout={<LogoutButton />}>
      {children}
    </AdminShell>
  )
}
