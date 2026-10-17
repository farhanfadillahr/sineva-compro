import { headers } from 'next/headers'
import { guardedMedia, mediaJson, readMediaUpload } from '@/features/media/http.server'
import { avatarUrl, uploadAvatar } from '@/features/profile/service.server'

export const runtime = 'nodejs'

/** The signed-in user's avatar, through a short-lived signed URL. */
export async function GET(request: Request) {
  return guardedMedia(request, false, async () => {
    const url = await avatarUrl(await headers())
    return url ? Response.redirect(url, 302) : new Response(null, { status: 404 })
  })
}

/** Uploads a new avatar (multipart, same limits and origin checks as media uploads). */
export async function POST(request: Request) {
  return guardedMedia(request, true, async () => {
    const upload = await readMediaUpload(request)
    await uploadAvatar(request.headers, upload)
    return mediaJson({ ok: true }, 201)
  })
}
