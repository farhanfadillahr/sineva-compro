import type { ReactNode } from 'react'
import { requirePrincipal } from '@/features/auth/session.server'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { AdminShell } from '@/components/admin/shell'
import { SeoPreviewProvider } from '@/components/admin/cms/seo-preview'
import { seoPreviewSettings } from '@/features/settings/service.server'
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePrincipal()
  return (
    <AdminShell principal={principal} logout={<LogoutButton />}>
      <SeoPreviewProvider value={await seoPreviewSettings()}>{children}</SeoPreviewProvider>
    </AdminShell>
  )
}
