import type { ReactNode } from 'react'
import { requirePrincipal } from '@/features/auth/session.server'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { AdminShell } from '@/components/admin/shell'
import { SeoPreviewProvider } from '@/components/admin/cms/seo-preview'
import { seoPreviewSettings } from '@/features/settings/service.server'
import { readPreferences } from '@/features/profile/service.server'
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePrincipal()
  // Preferences are a convenience: an unmigrated table falls back to the defaults.
  const preferences = await readPreferences(principal.id).catch(() => undefined)
  return (
    <AdminShell principal={principal} logout={<LogoutButton />} preferences={preferences}>
      <SeoPreviewProvider value={await seoPreviewSettings()}>{children}</SeoPreviewProvider>
    </AdminShell>
  )
}
