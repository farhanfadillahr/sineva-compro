import { redirect } from 'next/navigation'
import { requireCapability } from '@/features/auth/session.server'
import { mediaService } from '@/lib/media/runtime.server'
import { headers } from 'next/headers'
import { MediaLibrary } from '@/components/admin/media/library'
export const metadata = { title: 'Media' }
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireCapability('content:write')
  const params = await searchParams,
    search = typeof params.search === 'string' ? params.search.slice(0, 100) : '',
    kind =
      typeof params.kind === 'string' && ['image', 'video', 'document'].includes(params.kind)
        ? params.kind
        : '',
    page = typeof params.page === 'string' ? Number(params.page) : 1
  const result = await mediaService().list(await headers(), { search, kind, page })
  if (Number.isSafeInteger(page) && page > result.page)
    redirect(`/admin/media?${new URLSearchParams({ search, kind, page: String(result.page) })}`)
  return (
    <MediaLibrary
      key={`${search}:${kind}:${result.page}`}
      result={result}
      search={search}
      kind={kind}
    />
  )
}
