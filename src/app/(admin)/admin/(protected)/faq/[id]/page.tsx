import { routing } from '@/i18n/routing'
import { CollectionItemPage } from '@/features/collections/components/collection-item-page'
import { serviceTagOptions } from '@/features/faq/public.server'

export const metadata = { title: 'Pertanyaan FAQ' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <CollectionItemPage
      name="faq"
      id={id}
      basePath="/admin/faq"
      fieldOptions={{ serviceTags: await serviceTagOptions(routing.defaultLocale) }}
    />
  )
}
