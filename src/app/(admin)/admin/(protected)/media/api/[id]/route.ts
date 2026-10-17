import { guardedMedia, mediaJson, readMediaJson } from '@/features/media/http.server'
import { revalidateMediaUsage } from '@/features/media/revalidate.server'
import { mediaService } from '@/lib/media/runtime.server'
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  return guardedMedia(request, false, async () =>
    mediaJson(await mediaService().detail(request.headers, (await params).id)),
  )
}
export async function PATCH(request: Request, { params }: Context) {
  return guardedMedia(request, true, async () => {
    const id = (await params).id
    const detail = await mediaService().update(request.headers, id, await readMediaJson(request))
    await revalidateMediaUsage(id)
    return mediaJson(detail)
  })
}
// Media in use cannot be deleted, so no public page shows it and nothing needs refreshing.
export async function DELETE(request: Request, { params }: Context) {
  return guardedMedia(request, true, async () =>
    mediaJson(await mediaService().remove(request.headers, (await params).id)),
  )
}
