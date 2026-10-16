import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { routing } from '@/i18n/routing'
import { CmsError } from '@/features/cms/errors'
import { getServiceForAdmin, type ServiceItem } from '@/features/services/service.server'
import { ServiceEditor } from '@/features/services/components/service-editor'
import { getContentSource } from '@/lib/content-source'

export const metadata = { title: 'Layanan' }
const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireCapability('content:write')
  const { id } = await params
  let item: ServiceItem | null = null
  if (id !== 'new') {
    try {
      item = (await getServiceForAdmin(await headers(), id)).item
    } catch (error) {
      if (error instanceof CmsError && error.code === 'NOT_FOUND') notFound()
      throw error
    }
  }
  const home = await getContentSource().getPage('home', routing.defaultLocale)
  const local = item?.locales[routing.defaultLocale]
  return (
    <main>
      <PageHeader
        title={local ? String(local.data.title) : 'Tambah layanan'}
        description="FAQ layanan diatur di pustaka FAQ dengan tag layanan ini."
        meta={local ? `/services/${local.slug}` : undefined}
        status={
          item
            ? item.published
              ? { label: 'Terbit', tone: 'success' }
              : { label: 'Draf', tone: 'warning' }
            : undefined
        }
      />
      <ServiceEditor
        item={item}
        locales={routing.locales.map((code) => ({ code, label: localeLabels[code] ?? code }))}
        isAdmin={principal.role === 'admin'}
        defaultProcess={home?.howWeWork.steps.map((step) => ({ ...step })) ?? []}
      />
    </main>
  )
}
