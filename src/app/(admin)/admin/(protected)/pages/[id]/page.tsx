import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { PAGE_ROUTES } from '@/features/pages/fields'
import { loadPageForAdmin } from '@/features/pages/service.server'
import { PageEditor } from '@/features/pages/components/page-editor'

const localeLabels: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const route = PAGE_ROUTES.find((r) => r.id === id)
  return { title: route ? `Halaman ${route.label}` : 'Halaman' }
}

export default async function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability('content:write')
  const { id } = await params
  const route = PAGE_ROUTES.find((r) => r.id === id)
  if (!route) notFound()
  const { actor, locales } = await loadPageForAdmin(await headers(), route.key)
  return (
    <main>
      <PageHeader
        title={`Halaman ${route.label}`}
        description="Ubah isi tiap bagian. Bagian opsional dapat disembunyikan."
        meta={route.path ?? 'Ditampilkan untuk alamat yang tidak ditemukan'}
      />
      <PageEditor
        pageKey={route.key}
        locales={locales}
        labels={localeLabels}
        isAdmin={actor.role === 'admin'}
        publicPath={route.path}
      />
    </main>
  )
}
