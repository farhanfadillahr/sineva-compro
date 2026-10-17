import { CollectionItemPage } from '@/features/collections/components/collection-item-page'

export const metadata = { title: 'Jenis bisnis' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <CollectionItemPage name="businessTypes" id={id} basePath="/admin/product/business-types" />
  )
}
