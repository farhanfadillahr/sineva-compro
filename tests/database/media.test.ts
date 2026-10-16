import sharp from 'sharp'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq, inArray, sql } from 'drizzle-orm'
import { createAuthTestContext } from '../helpers/auth-context'
import { MemoryMediaStore } from '../../src/lib/media/memory-store'
import { MediaService } from '../../src/features/media/service.server'
import { getPublicMedia } from '../../src/features/media/query.server'
import { media, mediaUsage, mediaDelivery } from '../../src/features/media/schema'
import { auditLog } from '../../src/features/audit/schema'
import { user } from '../../src/features/auth/schema'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  service: MediaService,
  admin: Headers,
  editor: Headers,
  actorId: string
const owned: string[] = [],
  store = new MemoryMediaStore('test')
const meta = {
  translations: {
    en: { alt: 'Team at the office', caption: '' },
    id: { alt: 'Tim di kantor', caption: '' },
  },
  focalX: 0.5,
  focalY: 0.5,
  credit: '',
}
let body: Buffer
async function upload(headers = editor) {
  const row = await service.upload(headers, {
    body,
    filename: 'office.png',
    contentType: 'image/png',
    metadata: meta,
  })
  owned.push(row.id)
  return row
}
beforeAll(async () => {
  ctx = await createAuthTestContext()
  const a = await ctx.create('admin'),
    e = await ctx.create('editor')
  actorId = e.id
  admin = await ctx.headersFor(a)
  editor = await ctx.headersFor(e)
  service = new MediaService(ctx.connection.db, ctx.env, store)
  body = await sharp({ create: { width: 8, height: 4, channels: 3, background: 'red' } })
    .png()
    .toBuffer()
})
afterAll(async () => {
  if (ctx) {
    if (owned.length) {
      await ctx.connection.db
        .update(media)
        .set({ publicAssetId: null })
        .where(inArray(media.id, owned))
      await ctx.connection.db.delete(mediaUsage).where(inArray(mediaUsage.mediaId, owned))
      await ctx.connection.db.delete(mediaDelivery).where(inArray(mediaDelivery.mediaId, owned))
      await ctx.connection.db.delete(media).where(inArray(media.id, owned))
      await ctx.connection.db.delete(auditLog).where(inArray(auditLog.entityId, owned))
    }
    await ctx.cleanup()
  }
})
it('rejects anonymous before storage writes; Admin and Editor can upload and edit localized metadata', async () => {
  await expect(upload(new Headers())).rejects.toThrow()
  const a = await upload(admin),
    e = await upload()
  expect(a.id).not.toBe(e.id)
  expect(e.translations.en.alt).toBe(meta.translations.en.alt)
  const updated = await service.update(editor, e.id, {
    ...meta,
    credit: 'Sineva',
    translations: { en: { alt: 'Updated office', caption: 'Our workspace' } },
  })
  expect(updated.credit).toBe('Sineva')
  expect(updated.translations.en.alt).toBe('Updated office')
  expect(await getPublicMedia(ctx.connection.db, e.id, 'en', '', store.prefix)).toBeNull()
  const [row] = await ctx.connection.db.select().from(media).where(eq(media.id, e.id))
  expect(await store.head({ bucket: 'private', key: row.privateKey })).not.toBeNull()
  expect(
    (await ctx.connection.db.select().from(auditLog).where(eq(auditLog.entityId, e.id))).length,
  ).toBe(2)
})
it('publishes only after copying, returns safe DTOs, blocks in-use deletion and preserves ID on replace', async () => {
  const row = await upload(),
    owner = { entity: 'posts' as const, id: crypto.randomUUID(), label: 'Sample article' }
  let callbackRan = false
  await service.withReferences(
    editor,
    owner,
    [{ field: 'cover', mediaId: row.id, published: true }],
    async (_tx, assets) => {
      callbackRan = true
      expect(assets.cover?.url).toMatch(/^\/api\/media\/public\//)
    },
  )
  expect(callbackRan).toBe(true)
  const asset = await getPublicMedia(ctx.connection.db, row.id, 'en', '', store.prefix)
  expect(await getPublicMedia(ctx.connection.db, row.id, 'en', '', 'production')).toBeNull()
  expect(Object.keys(asset!).sort()).toEqual(
    ['alt', 'blurDataUrl', 'dominantColor', 'height', 'url', 'width'].sort(),
  )
  await expect(service.remove(editor, row.id)).rejects.toMatchObject({
    code: 'IN_USE',
    usages: [expect.objectContaining({ label: 'Sample article' })],
  })
  await expect(
    service.update(editor, row.id, { ...meta, translations: { en: { alt: '', caption: '' } } }),
  ).rejects.toThrow()
  const replacement = await sharp({
    create: { width: 4, height: 8, channels: 3, background: 'blue' },
  })
    .png()
    .toBuffer()
  const oldKey = (await ctx.connection.db.select().from(media).where(eq(media.id, row.id)))[0]
    .privateKey
  const next = await service.replace(editor, row.id, {
    body: replacement,
    filename: 'new.png',
    contentType: 'image/png',
  })
  expect(next.id).toBe(row.id)
  expect(await store.head({ bucket: 'private', key: oldKey })).toBeNull()
  expect(next.width).toBe(4)
  expect((await getPublicMedia(ctx.connection.db, row.id, 'en', '', store.prefix))?.url).not.toBe(
    asset?.url,
  )
  expect(
    (await ctx.connection.db.select().from(mediaDelivery).where(eq(mediaDelivery.mediaId, row.id)))
      .length,
  ).toBe(2)
  await service.withReferences(editor, owner, [], async () => {})
  await service.remove(editor, row.id)
  expect(await getPublicMedia(ctx.connection.db, row.id, 'en', '', store.prefix)).toBeNull()
  await expect(service.detail(editor, row.id)).rejects.toMatchObject({ code: 'NOT_FOUND' })
})
it('requires alt at publish and rolls back copied objects and usage when the document callback fails', async () => {
  const row = await upload(),
    owner = { entity: 'posts' as const, id: crypto.randomUUID(), label: 'Rollback article' }
  await service.update(editor, row.id, { ...meta, translations: { en: { alt: '', caption: '' } } })
  await expect(
    service.withReferences(
      editor,
      owner,
      [{ field: 'cover', mediaId: row.id, published: true }],
      async () => {},
    ),
  ).rejects.toThrow()
  await service.update(editor, row.id, meta)
  const before = await store.list('public', 'test/')
  await expect(
    service.withReferences(
      editor,
      owner,
      [{ field: 'cover', mediaId: row.id, published: true }],
      async () => {
        throw new Error('Document failed')
      },
    ),
  ).rejects.toThrow('Document failed')
  expect(await store.list('public', 'test/')).toEqual(before)
  expect(await getPublicMedia(ctx.connection.db, row.id, 'en', '', store.prefix)).toBeNull()
  expect(
    await ctx.connection.db.select().from(mediaUsage).where(eq(mediaUsage.mediaId, row.id)),
  ).toHaveLength(0)
})
it('rolls back metadata on audit failure and removes newly uploaded objects', async () => {
  const row = await upload(),
    before = await store.list('private', 'test/')
  await ctx.connection.db.execute(
    sql`CREATE FUNCTION reject_cpr23_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity = 'media' THEN RAISE EXCEPTION 'test audit failure'; END IF; RETURN NEW; END $$`,
  )
  await ctx.connection.db.execute(
    sql`CREATE TRIGGER reject_cpr23_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION reject_cpr23_audit()`,
  )
  try {
    await expect(
      service.update(editor, row.id, { ...meta, credit: 'Should rollback' }),
    ).rejects.toThrow()
    await expect(upload()).rejects.toThrow()
  } finally {
    await ctx.connection.db.execute(sql`DROP TRIGGER reject_cpr23_audit ON audit_log`)
    await ctx.connection.db.execute(sql`DROP FUNCTION reject_cpr23_audit()`)
  }
  expect((await service.detail(editor, row.id)).credit).toBe('')
  expect(await store.list('private', 'test/')).toEqual(before)
})
it('rechecks an account deactivated after its session was issued', async () => {
  await ctx.connection.db.update(user).set({ banned: true }).where(eq(user.id, actorId))
  await expect(upload()).rejects.toThrow()
  await ctx.connection.db.update(user).set({ banned: false }).where(eq(user.id, actorId))
})

it('publishes with the default locale alt; a locale without alt shows no image there', async () => {
  const row = await upload()
  // Media uploaded before `id` was enabled has no Indonesian alt (CPR-101).
  await service.update(editor, row.id, {
    ...meta,
    translations: { ...meta.translations, id: { alt: '', caption: '' } },
  })
  const owner = { entity: 'posts' as const, id: crypto.randomUUID(), label: 'Locale fixture' }
  await service.withReferences(
    editor,
    owner,
    [{ field: 'cover', mediaId: row.id, published: true }],
    async () => {},
  )
  expect(await getPublicMedia(ctx.connection.db, row.id, 'en', '', store.prefix)).not.toBeNull()
  expect(await getPublicMedia(ctx.connection.db, row.id, 'id', '', store.prefix)).toBeNull()
  await service.withReferences(editor, owner, [], async () => {})
})
it('enforces non-null image dimensions at the database boundary', async () => {
  const row = await upload()
  const [source] = await ctx.connection.db.select().from(media).where(eq(media.id, row.id))
  const id = crypto.randomUUID()
  owned.push(id)
  await expect(
    ctx.connection.db
      .insert(media)
      .values({ ...source, id, privateKey: 'test/' + id, width: null }),
  ).rejects.toThrow()
})
