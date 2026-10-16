import { guardedMedia } from '@/features/media/http.server'
import { mediaService } from '@/lib/media/runtime.server'
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guardedMedia(request, false, async () => {
    const url = await mediaService().preview(request.headers, (await params).id)
    return new Response(null, {
      status: 302,
      headers: {
        location: url,
        'cache-control': 'private, no-store',
        'referrer-policy': 'no-referrer',
      },
    })
  })
}
