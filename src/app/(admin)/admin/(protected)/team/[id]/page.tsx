import { CollectionItemPage } from '@/features/collections/components/collection-item-page'

export const metadata = { title: 'Anggota tim' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CollectionItemPage name="team" id={id} basePath="/admin/team" />
}
