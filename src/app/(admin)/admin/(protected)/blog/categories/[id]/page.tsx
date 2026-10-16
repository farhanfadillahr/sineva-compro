import { CollectionItemPage } from '@/features/collections/components/collection-item-page'

export const metadata = { title: 'Kategori' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CollectionItemPage name="categories" id={id} basePath="/admin/blog/categories" />
}
