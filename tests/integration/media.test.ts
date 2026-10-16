import 'dotenv/config'
import sharp from 'sharp'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { createAuthTestContext } from '../helpers/auth-context'
import { S3MediaStore } from '../../src/lib/media/s3-store.server'
import { MediaService } from '../../src/features/media/service.server'
import { getPublicMedia } from '../../src/features/media/query.server'
import { media, mediaDelivery, mediaUsage } from '../../src/features/media/schema'
import { auditLog } from '../../src/features/audit/schema'
const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3023')
if (!['127.0.0.1', 'localhost'].includes(base.hostname))
  throw new Error('Media HTTP tests require loopback')
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  admin: Headers,
  editor: Headers,
  store: S3MediaStore,
  service: MediaService,
  png: Buffer
const ids: string[] = [],
  meta = {
    translations: { en: { alt: 'QA office photo', caption: '' } },
    focalX: 0.5,
    focalY: 0.5,
    credit: '',
  }
function form(body = png, metadata: unknown = meta, name = 'qa.png', type = 'image/png') {
  const value = new FormData()
  value.set('file', new Blob([new Uint8Array(body)], { type }), name)
  value.set('metadata', JSON.stringify(metadata))
  return value
}
const request = (path: string, options: RequestInit = {}) => fetch(new URL(path, base), options)
async function upload(headers = editor) {
  const response = await request('/admin/media/api', { method: 'POST', headers, body: form() })
  expect(response.status).toBe(201)
  const item = await response.json()
  ids.push(item.id)
  return item
}
beforeAll(async () => {
  ctx = await createAuthTestContext()
  admin = await ctx.headersFor(await ctx.create('admin'))
  editor = await ctx.headersFor(await ctx.create('editor'))
  const endpoint = process.env.STORAGE_ENDPOINT ?? 'http://127.0.0.1:8333'
  if (!['127.0.0.1', 'localhost'].includes(new URL(endpoint).hostname))
    throw new Error('Media fixture storage must be local')
  store = new S3MediaStore({
    endpoint,
    prefix: process.env.MEDIA_PREFIX ?? 'local',
    credentials: {
      accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY!,
    },
  })
  service = new MediaService(ctx.connection.db, ctx.env, store)
  png = await sharp({ create: { width: 24, height: 16, channels: 3, background: 'teal' } })
    .png()
    .toBuffer()
})
afterAll(async () => {
  try {
    if (ctx && ids.length) {
      const rows = await ctx.connection.db.select().from(media).where(inArray(media.id, ids)),
        deliveries = await ctx.connection.db
          .select()
          .from(mediaDelivery)
          .where(inArray(mediaDelivery.mediaId, ids))
      for (const row of rows) await store.delete({ bucket: 'private', key: row.privateKey })
      for (const row of deliveries) await store.delete({ bucket: 'public', key: row.key })
      await ctx.connection.db
        .update(media)
        .set({ publicAssetId: null })
        .where(inArray(media.id, ids))
      await ctx.connection.db.delete(mediaUsage).where(inArray(mediaUsage.mediaId, ids))
      await ctx.connection.db.delete(mediaDelivery).where(inArray(mediaDelivery.mediaId, ids))
      await ctx.connection.db.delete(media).where(inArray(media.id, ids))
      await ctx.connection.db.delete(auditLog).where(inArray(auditLog.entityId, ids))
    }
  } finally {
    store?.close()
    if (ctx) await ctx.cleanup()
  }
})
it('rejects anonymous and cross-origin mutations before accepting files', async () => {
  expect((await request('/admin/media/api', { method: 'POST', body: form() })).status).toBe(401)
  const cross = new Headers(editor)
  cross.set('origin', 'https://untrusted.invalid')
  expect(
    (await request('/admin/media/api', { method: 'POST', headers: cross, body: form() })).status,
  ).toBe(403)
  expect((await request('/admin/media/api')).status).toBe(401)
})
it('accepts Admin and Editor, edits alt, and provides authenticated signed previews', async () => {
  const item = await upload(),
    other = await upload(admin)
  const headers = new Headers(editor)
  headers.set('content-type', 'application/json')
  const edited = await request(`/admin/media/api/${item.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      ...meta,
      translations: { en: { alt: 'Edited photo', caption: 'Workspace' } },
    }),
  })
  expect(edited.status).toBe(200)
  expect((await edited.json()).translations.en.alt).toBe('Edited photo')
  const response = await request(item.previewUrl, { headers: editor, redirect: 'manual' })
  expect(response.status).toBe(302)
  expect(response.headers.get('cache-control')).toContain('no-store')
  const file = await fetch(response.headers.get('location')!)
  expect(file.status).toBe(200)
  expect((await sharp(Buffer.from(await file.arrayBuffer())).metadata()).width).toBe(24)
  expect((await request(other.previewUrl, { redirect: 'manual' })).status).toBe(401)
})
it('rejects disguised files, missing alt and oversized JSON at the HTTP boundary', async () => {
  expect(
    (
      await request('/admin/media/api', {
        method: 'POST',
        headers: editor,
        body: form(Buffer.from('<html>fake image</html>')),
      })
    ).status,
  ).toBe(400)
  expect(
    (
      await request('/admin/media/api', {
        method: 'POST',
        headers: editor,
        body: form(png, { ...meta, translations: { en: { alt: '', caption: '' } } }),
      })
    ).status,
  ).toBe(400)
  const headers = new Headers(editor)
  headers.set('content-type', 'application/json')
  expect(
    (
      await request(`/admin/media/api/${ids[0]}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...meta, credit: 'x'.repeat(17000) }),
      })
    ).status,
  ).toBe(400)
})
it('serves only committed public delivery, supports HEAD/ranges and blocks in-use deletion', async () => {
  const item = await upload(),
    owner = { entity: 'posts' as const, id: crypto.randomUUID(), label: '[QA] Media HTTP fixture' }
  expect(await getPublicMedia(ctx.connection.db, item.id, 'en', '', store.prefix)).toBeNull()
  await service.withReferences(
    editor,
    owner,
    [{ field: 'cover', mediaId: item.id, published: true }],
    async () => {},
  )
  const dto = await getPublicMedia(ctx.connection.db, item.id, 'en', '', store.prefix)
  expect(dto).not.toBeNull()
  const publicResponse = await request(dto!.url)
  expect(publicResponse.status).toBe(200)
  expect(publicResponse.headers.get('cache-control')).toContain('immutable')
  expect((await sharp(Buffer.from(await publicResponse.arrayBuffer())).metadata()).width).toBe(24)
  expect((await request(dto!.url, { method: 'HEAD' })).status).toBe(200)
  const optimized = await request(
    '/_next/image?' + new URLSearchParams({ url: dto!.url, w: '640', q: '75' }),
  )
  expect(optimized.status).toBe(200)
  expect(
    (await sharp(Buffer.from(await optimized.arrayBuffer())).metadata()).width,
  ).toBeGreaterThan(0)
  const privateOptimization = await request(
    '/_next/image?' + new URLSearchParams({ url: item.previewUrl, w: '640', q: '75' }),
    { headers: editor },
  )
  expect(privateOptimization.status).toBe(400)
  const range = await request(dto!.url, { headers: { range: 'bytes=0-3' } })
  expect(range.status).toBe(206)
  expect((await range.arrayBuffer()).byteLength).toBe(4)
  expect((await request(dto!.url, { headers: { range: 'bytes=999999-' } })).status).toBe(416)
  const previous = (await ctx.connection.db.select().from(media).where(eq(media.id, item.id)))[0]
  const replacedBody = await sharp({
    create: { width: 12, height: 24, channels: 3, background: 'blue' },
  })
    .png()
    .toBuffer()
  const replaced = await request(`/admin/media/api/${item.id}/file`, {
    method: 'PUT',
    headers: editor,
    body: form(replacedBody, meta, 'replacement.png'),
  })
  expect(replaced.status).toBe(200)
  expect((await replaced.json()).id).toBe(item.id)
  expect(await store.head({ bucket: 'private', key: previous.privateKey })).toBeNull()
  const current = await getPublicMedia(ctx.connection.db, item.id, 'en', '', store.prefix)
  expect(current?.url).not.toBe(dto!.url)
  expect((await request(dto!.url)).status).toBe(200)
  expect(
    (await request(`/admin/media/api/${item.id}`, { method: 'DELETE', headers: editor })).status,
  ).toBe(409)
  await service.withReferences(editor, owner, [], async () => {})
  expect(
    (await request(`/admin/media/api/${item.id}`, { method: 'DELETE', headers: editor })).status,
  ).toBe(200)
  expect((await request(`/admin/media/api/${item.id}`, { headers: editor })).status).toBe(404)

  expect((await request('/api/media/public/00000000-0000-4000-8000-000000000000.png')).status).toBe(
    404,
  )
})
