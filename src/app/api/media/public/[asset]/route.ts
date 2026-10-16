import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client.server'
import { media, mediaDelivery } from '@/features/media/schema'
import { mediaStore } from '@/lib/media/runtime.server'
type Context = { params: Promise<{ asset: string }> }
async function delivery(request: Request, { params }: Context, head = false) {
  try {
    const match = (await params).asset.match(
      /^([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})\.(jpg|png|webp|avif|mp4|webm|pdf)$/,
    )
    if (!match) return new Response(null, { status: 404 })
    const store = mediaStore()
    const [row] = await db
      .select({
        key: mediaDelivery.key,
        size: mediaDelivery.size,
        contentType: mediaDelivery.contentType,
        extension: mediaDelivery.extension,
      })
      .from(mediaDelivery)
      .innerJoin(media, eq(mediaDelivery.mediaId, media.id))
      .where(
        and(
          eq(mediaDelivery.id, match[1]),
          eq(mediaDelivery.extension, match[2]),
          eq(media.environment, store.prefix),
        ),
      )
    if (!row) return new Response(null, { status: 404 })
    const result = head
      ? await store.head({ bucket: 'public', key: row.key })
      : await store.get({ bucket: 'public', key: row.key })
    if (!result) return new Response(null, { status: 404 })
    const headers = new Headers({
      'content-type': row.contentType,
      'content-length': String(result.size),
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'accept-ranges': 'bytes',
      'content-disposition': row.extension === 'pdf' ? 'attachment' : 'inline',
    })
    if (head) return new Response(null, { headers })
    if (!('body' in result) || !Buffer.isBuffer(result.body))
      return new Response(null, { status: 503 })
    const body = result.body,
      range = request.headers.get('range')
    if (range) {
      const parts = range.match(/^bytes=(\d*)-(\d*)$/)
      let start = 0,
        end = body.length - 1
      if (!parts || (!parts[1] && !parts[2]))
        return new Response(null, {
          status: 416,
          headers: { 'content-range': `bytes */${body.length}` },
        })
      if (parts[1]) {
        start = Number(parts[1])
        if (parts[2]) end = Math.min(Number(parts[2]), end)
      } else start = Math.max(0, body.length - Number(parts[2]))
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= body.length
      )
        return new Response(null, {
          status: 416,
          headers: { 'content-range': `bytes */${body.length}` },
        })
      headers.set('content-range', `bytes ${start}-${end}/${body.length}`)
      headers.set('content-length', String(end - start + 1))
      return new Response(new Uint8Array(body.subarray(start, end + 1)), { status: 206, headers })
    }
    return new Response(new Uint8Array(body), { headers })
  } catch {
    return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } })
  }
}
export async function GET(request: Request, context: Context) {
  return delivery(request, context)
}
export async function HEAD(request: Request, context: Context) {
  return delivery(request, context, true)
}
