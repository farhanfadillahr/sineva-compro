import { guardedMedia, mediaJson, readMediaJson } from '@/features/media/http.server'
import { mediaService } from '@/lib/media/runtime.server'
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  return guardedMedia(request, false, async () =>
    mediaJson(await mediaService().detail(request.headers, (await params).id)),
  )
}
export async function PATCH(request: Request, { params }: Context) {
  return guardedMedia(request, true, async () =>
    mediaJson(
      await mediaService().update(request.headers, (await params).id, await readMediaJson(request)),
    ),
  )
}
export async function DELETE(request: Request, { params }: Context) {
  return guardedMedia(request, true, async () =>
    mediaJson(await mediaService().remove(request.headers, (await params).id)),
  )
}
