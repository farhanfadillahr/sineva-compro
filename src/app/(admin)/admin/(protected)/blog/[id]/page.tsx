import { DocumentPage } from '@/features/documents/components/document-page'
import { postFieldOptions } from '@/features/posts/options.server'

export const metadata = { title: 'Artikel' }

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DocumentPage name="posts" id={id} fieldOptions={await postFieldOptions()} />
}
