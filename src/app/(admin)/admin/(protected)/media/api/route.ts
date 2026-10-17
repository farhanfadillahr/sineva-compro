import { guardedMedia, mediaJson, readMediaUpload } from '@/features/media/http.server'
import { mediaService } from '@/lib/media/runtime.server'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  return guardedMedia(request, false, async () => {
    const params = new URL(request.url).searchParams
    return mediaJson(
      await mediaService().list(request.headers, {
        search: params.get('search') ?? '',
        kind: params.get('kind') ?? '',
        page: Number(params.get('page') ?? 1),
        pageSize: Number(params.get('pageSize') ?? 20),
      }),
    )
  })
}
export async function POST(request: Request) {
  return guardedMedia(request, true, async () =>
    mediaJson(await mediaService().upload(request.headers, await readMediaUpload(request)), 201),
  )
}
