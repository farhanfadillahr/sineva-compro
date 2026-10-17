import { DocumentPage } from '@/features/documents/components/document-page'
import { workFieldOptions } from '@/features/work/options.server'

export const metadata = { title: 'Karya' }

export default async function WorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DocumentPage name="work" id={id} fieldOptions={await workFieldOptions()} />
}
