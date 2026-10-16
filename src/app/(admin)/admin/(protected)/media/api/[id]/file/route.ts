import { guardedMedia, mediaJson, readMediaUpload } from '@/features/media/http.server'
import { mediaService } from '@/lib/media/runtime.server'
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guardedMedia(request, true, async () =>
    mediaJson(
      await mediaService().replace(
        request.headers,
        (await params).id,
        await readMediaUpload(request),
      ),
    ),
  )
}
