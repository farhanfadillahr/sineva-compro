import { guardedMedia, mediaJson, readMediaUpload } from '@/features/media/http.server'
import { revalidateMediaUsage } from '@/features/media/revalidate.server'
import { mediaService } from '@/lib/media/runtime.server'
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guardedMedia(request, true, async () => {
    const id = (await params).id
    const detail = await mediaService().replace(request.headers, id, await readMediaUpload(request))
    await revalidateMediaUsage(id)
    return mediaJson(detail)
  })
}
