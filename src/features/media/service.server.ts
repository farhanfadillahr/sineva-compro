import 'server-only'
import { routing } from '../../i18n/routing'
import { randomUUID } from 'node:crypto'
import { and, asc, count, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import type { readServerEnv } from '../../env/server'
import type { MediaLocation, MediaStore } from '../../lib/media/store'
import { assertCapability, loadPrincipal } from '../auth/access.server'
import { AccessDeniedError } from '../auth/access-errors'
import type { Principal } from '../auth/types'
import { user } from '../auth/schema'
import { writeAudit } from '../audit/service.server'
import { media, mediaDelivery, mediaTranslation, mediaUsage } from './schema'
import {
  MediaError,
  mediaId,
  parseMediaMetadata,
  requireDefaultAlt,
  type MediaMetadata,
} from './metadata'
import { validateUpload, type CleanUpload } from './validation'
import { getPublicMedia, publicMediaUrl, type PublishedMedia } from './query.server'
import type { MediaItem, MediaOwner, MediaPage, MediaReference } from './types'
type Env = ReturnType<typeof readServerEnv>
type Row = typeof media.$inferSelect
type UploadInput = { body: Buffer; filename: string; contentType: string }
const noMedia = () => new MediaError('NOT_FOUND', 'Media tidak ditemukan.')

export class MediaService {
  constructor(
    private database: Database,
    private env: Env,
    private store: MediaStore,
    private origin = '',
  ) {}
  async authorize(headers: Headers, database: Database | DatabaseTransaction = this.database) {
    return assertCapability(await loadPrincipal(database, this.env, headers), 'content:write')
  }
  private async transaction<T>(
    headers: Headers,
    run: (tx: DatabaseTransaction, actor: Principal) => Promise<T>,
  ) {
    return this.database.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
      const actor = await this.authorize(headers, tx)
      await tx.select({ id: user.id }).from(user).where(eq(user.id, actor.id)).for('update')
      const latest = await this.authorize(headers, tx)
      return run(tx, latest)
    })
  }
  private async lock(tx: DatabaseTransaction, id: string, deleted = false) {
    const [row] = await tx
      .select()
      .from(media)
      .where(and(eq(media.id, mediaId(id)), eq(media.environment, this.store.prefix)))
      .for('update')
    if (!row || (!deleted && row.deletedAt)) throw noMedia()
    return row
  }
  private async translated(tx: Database | DatabaseTransaction, id: string) {
    const rows = await tx.select().from(mediaTranslation).where(eq(mediaTranslation.mediaId, id))
    return Object.fromEntries(
      rows
        .filter((row) => (routing.locales as readonly string[]).includes(row.locale))
        .map((row) => [row.locale, { alt: row.alt, caption: row.caption }]),
    )
  }
  private async saveMetadata(tx: DatabaseTransaction, id: string, data: MediaMetadata) {
    await tx
      .update(media)
      .set({ credit: data.credit, focalX: data.focalX, focalY: data.focalY, updatedAt: new Date() })
      .where(eq(media.id, id))
    for (const [locale, value] of Object.entries(data.translations))
      await tx
        .insert(mediaTranslation)
        .values({ mediaId: id, locale, ...value })
        .onConflictDoUpdate({
          target: [mediaTranslation.mediaId, mediaTranslation.locale],
          set: value,
        })
  }
  private async shapes(tx: Database | DatabaseTransaction, rows: Row[]): Promise<MediaItem[]> {
    if (!rows.length) return []
    const ids = rows.map((row) => row.id),
      publicIds = rows.flatMap((row) => (row.publicAssetId ? [row.publicAssetId] : []))
    const [translations, usages, deliveries] = await Promise.all([
      tx.select().from(mediaTranslation).where(inArray(mediaTranslation.mediaId, ids)),
      tx.select().from(mediaUsage).where(inArray(mediaUsage.mediaId, ids)),
      publicIds.length
        ? tx.select().from(mediaDelivery).where(inArray(mediaDelivery.id, publicIds))
        : Promise.resolve([]),
    ])
    return rows.map((row) => ({
      isDemo: row.isDemo,
      id: row.id,
      filename: row.filename,
      kind: row.kind,
      contentType: row.contentType,
      size: row.size,
      width: row.width,
      height: row.height,
      dominantColor: row.dominantColor,
      credit: row.credit,
      focalX: row.focalX,
      focalY: row.focalY,
      translations: Object.fromEntries(
        translations
          .filter(
            (t) =>
              t.mediaId === row.id && (routing.locales as readonly string[]).includes(t.locale),
          )
          .map((t) => [t.locale, { alt: t.alt, caption: t.caption }]),
      ),
      previewUrl: `/admin/media/api/${row.id}/preview?v=${row.hash}`,
      publicUrl: deliveries.find((d) => d.id === row.publicAssetId)
        ? publicMediaUrl(
            deliveries.find((d) => d.id === row.publicAssetId)!,
            this.origin,
          )
        : null,
      usageCount: usages.filter((u) => u.mediaId === row.id).length,
      usages: usages
        .filter((u) => u.mediaId === row.id)
        .map(({ entity, entityId, field, label, published }) => ({
          entity,
          entityId,
          field,
          label,
          published,
        })),
    }))
  }
  async detail(headers: Headers, id: string): Promise<MediaItem> {
    await this.authorize(headers)
    const [row] = await this.database
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, mediaId(id)),
          eq(media.environment, this.store.prefix),
          isNull(media.deletedAt),
        ),
      )
    if (!row) throw noMedia()
    return (await this.shapes(this.database, [row]))[0]
  }
  async list(
    headers: Headers,
    input: { search?: string; kind?: string; page?: number; pageSize?: number } = {},
  ): Promise<MediaPage> {
    await this.authorize(headers)
    const search = (input.search ?? '').trim().slice(0, 100),
      kind = input.kind ?? ''
    if (!['', 'image', 'video', 'document'].includes(kind))
      throw new MediaError('INVALID', 'Filter media tidak valid.')
    const pageSize = [20, 50, 100].includes(input.pageSize ?? 0) ? input.pageSize! : 20
    const requested =
      Number.isSafeInteger(input.page) && input.page! > 0 ? Math.min(input.page!, 100000) : 1
    return this.database.transaction(
      async (tx) => {
        const where = and(
          eq(media.environment, this.store.prefix),
          isNull(media.deletedAt),
          kind ? eq(media.kind, kind) : undefined,
          search ? ilike(media.filename, `%${search.replace(/[%_\\]/g, '\\$&')}%`) : undefined,
        )
        const [{ total }] = await tx.select({ total: count() }).from(media).where(where),
          page = Math.min(requested, Math.max(1, Math.ceil(total / pageSize)))
        const rows = await tx
          .select()
          .from(media)
          .where(where)
          .orderBy(desc(media.createdAt), desc(media.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize)
        return { items: await this.shapes(tx, rows), total, page, pageSize }
      },
      { isolationLevel: 'repeatable read' },
    )
  }
  private fileValues(file: CleanUpload, key: string) {
    return {
      filename: file.filename,
      kind: file.kind,
      contentType: file.contentType,
      extension: file.extension,
      size: file.body.length,
      privateKey: key,
      hash: file.hash,
      width: file.width,
      height: file.height,
      dominantColor: file.dominantColor,
    }
  }
  private objectKey(file: CleanUpload) {
    return `${this.store.prefix}/${randomUUID()}-${file.hash}.${file.extension}`
  }
  /** Compensation never deletes a key whose transaction may have committed. */
  private async cleanup(locations: MediaLocation[]) {
    for (const location of locations) {
      try {
        const linked =
          location.bucket === 'private'
            ? await this.database
                .select({ id: media.id })
                .from(media)
                .where(eq(media.privateKey, location.key))
            : await this.database
                .select({ id: mediaDelivery.id })
                .from(mediaDelivery)
                .where(eq(mediaDelivery.key, location.key))
        if (!linked.length) await this.store.delete(location)
      } catch {
        /* Retain an orphan rather than risk deleting a committed file on an ambiguous failure. */
      }
    }
  }
  async upload(headers: Headers, input: UploadInput & { metadata: unknown }) {
    await this.authorize(headers)
    const data = parseMediaMetadata(input.metadata, true),
      file = await validateUpload(input.body, input.filename, input.contentType),
      key = this.objectKey(file)
    const locations: MediaLocation[] = [{ bucket: 'private', key }]
    try {
      await this.store.put({ ...locations[0], body: file.body, contentType: file.contentType })
      const id = await this.transaction(headers, async (tx, actor) => {
        const [row] = await tx
          .insert(media)
          .values({
            ...this.fileValues(file, key),
            environment: this.store.prefix,
            createdBy: actor.id,
          })
          .returning({ id: media.id })
        await this.saveMetadata(tx, row.id, data)
        await writeAudit(tx, actor, {
          entity: 'media',
          entityId: row.id,
          action: 'create',
          changedFields: ['file', 'alt', 'caption', 'credit', 'focalPoint'],
        })
        return row.id
      })
      return this.detail(headers, id)
    } catch (error) {
      await this.cleanup(locations)
      throw error
    }
  }
  async update(headers: Headers, id: string, input: unknown) {
    await this.authorize(headers)
    const data = parseMediaMetadata(input)
    await this.transaction(headers, async (tx, actor) => {
      await this.lock(tx, id)
      const used = await tx
        .select({ id: mediaUsage.id })
        .from(mediaUsage)
        .where(and(eq(mediaUsage.mediaId, id), eq(mediaUsage.published, true)))
        .limit(1)
      if (used.length) requireDefaultAlt(data)
      await this.saveMetadata(tx, id, data)
      await writeAudit(tx, actor, {
        entity: 'media',
        entityId: id,
        action: 'update',
        changedFields: ['alt', 'caption', 'credit', 'focalPoint'],
      })
    })
    return this.detail(headers, id)
  }
  private async promote(
    tx: DatabaseTransaction,
    actor: Principal,
    row: Row,
    created: MediaLocation[],
  ) {
    if (row.isDemo)
      throw new MediaError('INVALID', 'Ganti file contoh dengan upload nyata sebelum publikasi.')
    requireDefaultAlt({
      translations: await this.translated(tx, row.id),
      credit: row.credit,
      focalX: row.focalX,
      focalY: row.focalY,
    })
    let [delivery] = await tx
      .select()
      .from(mediaDelivery)
      .where(and(eq(mediaDelivery.mediaId, row.id), eq(mediaDelivery.hash, row.hash)))
    if (!delivery) {
      const key = `${this.store.prefix}/${randomUUID()}-${row.hash}.${row.extension}`
      created.push({ bucket: 'public', key })
      await this.store.copy({ bucket: 'private', key: row.privateKey }, { bucket: 'public', key })
      if ((await this.store.head({ bucket: 'public', key }))?.size !== row.size)
        throw new MediaError('UNAVAILABLE', 'Salinan publik belum siap.')
      ;[delivery] = await tx
        .insert(mediaDelivery)
        .values({
          mediaId: row.id,
          hash: row.hash,
          key,
          contentType: row.contentType,
          extension: row.extension,
          size: row.size,
        })
        .returning()
    }
    if (row.publicAssetId !== delivery.id) {
      await tx.update(media).set({ publicAssetId: delivery.id }).where(eq(media.id, row.id))
      await writeAudit(tx, actor, {
        entity: 'media',
        entityId: row.id,
        action: 'publish',
        changedFields: ['file'],
      })
    }
  }
  async replace(headers: Headers, id: string, input: UploadInput) {
    await this.authorize(headers)
    mediaId(id)
    const file = await validateUpload(input.body, input.filename, input.contentType),
      key = this.objectKey(file),
      created: MediaLocation[] = [{ bucket: 'private', key }]
    let oldPrivateKey: string | undefined
    try {
      await this.store.put({ ...created[0], body: file.body, contentType: file.contentType })
      await this.transaction(headers, async (tx, actor) => {
        const old = await this.lock(tx, id)
        oldPrivateKey = old.privateKey
        if (old.kind !== file.kind)
          throw new MediaError(
            'INVALID',
            'Jenis file pengganti harus sama dengan media sebelumnya.',
          )
        const [row] = await tx
          .update(media)
          .set({
            ...this.fileValues(file, key),
            isDemo: false,
            publicAssetId: null,
            updatedAt: new Date(),
          })
          .where(eq(media.id, id))
          .returning()
        const used = await tx
          .select({ id: mediaUsage.id })
          .from(mediaUsage)
          .where(and(eq(mediaUsage.mediaId, id), eq(mediaUsage.published, true)))
          .limit(1)
        if (used.length) await this.promote(tx, actor, row, created)
        await writeAudit(tx, actor, {
          entity: 'media',
          entityId: id,
          action: 'update',
          changedFields: ['file'],
        })
      })
      if (oldPrivateKey) await this.cleanup([{ bucket: 'private', key: oldPrivateKey }])
      return this.detail(headers, id)
    } catch (error) {
      await this.cleanup(created)
      throw error
    }
  }
  async remove(headers: Headers, id: string) {
    await this.authorize(headers)
    const row = await this.transaction(headers, async (tx, actor) => {
      const current = await this.lock(tx, id, true),
        usages = await tx.select().from(mediaUsage).where(eq(mediaUsage.mediaId, id))
      if (usages.length)
        throw new MediaError(
          'IN_USE',
          'Media masih digunakan. Lepaskan pemakaian sebelum menghapus.',
          usages,
        )
      if (!current.deletedAt) {
        await tx
          .update(media)
          .set({ deletedAt: new Date(), cleanupPending: true })
          .where(eq(media.id, id))
        await writeAudit(tx, actor, {
          entity: 'media',
          entityId: id,
          action: 'delete',
          changedFields: ['file'],
        })
      }
      return current
    })
    try {
      await this.store.delete({ bucket: 'private', key: row.privateKey })
      await this.database.update(media).set({ cleanupPending: false }).where(eq(media.id, id))
      return { cleanupPending: false }
    } catch {
      return { cleanupPending: true }
    }
  }
  async preview(headers: Headers, id: string) {
    await this.authorize(headers)
    const [row] = await this.database
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, mediaId(id)),
          eq(media.environment, this.store.prefix),
          isNull(media.deletedAt),
        ),
      )
    if (!row) throw noMedia()
    if (row.isDemo)
      throw new MediaError('INVALID', 'Contoh metadata belum memiliki file. Unggah file pengganti.')
    return this.store.presign({ bucket: 'private', key: row.privateKey }, 'GET', 120)
  }
  /** Content callback MUST write the document with this transaction; never publish outside it. */
  async withReferences<T>(
    headers: Headers,
    owner: MediaOwner,
    refs: MediaReference[],
    run: (tx: DatabaseTransaction, assets: Record<string, PublishedMedia | null>) => Promise<T>,
  ): Promise<T> {
    await this.authorize(headers)
    if (
      !['pages', 'services', 'posts', 'portfolio', 'team', 'settings', 'product'].includes(
        owner.entity,
      ) ||
      !/^[A-Za-z0-9:_-]{1,128}$/.test(owner.id) ||
      !owner.label.trim() ||
      owner.label.length > 160 ||
      refs.length > 100 ||
      new Set(refs.map((r) => r.field)).size !== refs.length ||
      refs.some((r) => !/^\w[\w.-]{0,63}$/.test(r.field) || typeof r.published !== 'boolean')
    )
      throw new MediaError('INVALID', 'Referensi media tidak valid.')
    refs.forEach((r) => mediaId(r.mediaId))
    const created: MediaLocation[] = []
    try {
      return await this.transaction(headers, async (tx, actor) => {
        if (owner.entity === 'settings' && actor.role !== 'admin')
          throw new AccessDeniedError('FORBIDDEN')
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`media:${owner.entity}:${owner.id}`},0))`,
        )
        const where = and(eq(mediaUsage.entity, owner.entity), eq(mediaUsage.entityId, owner.id))
        const old = await tx.select({ mediaId: mediaUsage.mediaId }).from(mediaUsage).where(where)
        const ids = [
          ...new Set([...old.map((r) => r.mediaId), ...refs.map((r) => r.mediaId)]),
        ].sort()
        const rows = ids.length
          ? await tx
              .select()
              .from(media)
              .where(inArray(media.id, ids))
              .orderBy(asc(media.id))
              .for('update')
          : []
        const assets: Record<string, PublishedMedia | null> = Object.create(null)
        for (const ref of refs) {
          const row = rows.find((row) => row.id === ref.mediaId)
          if (!row || row.deletedAt || row.environment !== this.store.prefix) throw noMedia()
          if (ref.published) {
            await this.promote(tx, actor, row, created)
            assets[ref.field] = await getPublicMedia(
              tx,
              row.id,
              'en',
              this.origin,
              this.store.prefix,
            )
          } else assets[ref.field] = null
        }
        await tx.delete(mediaUsage).where(where)
        if (refs.length)
          await tx.insert(mediaUsage).values(
            refs.map((ref) => ({
              mediaId: ref.mediaId,
              field: ref.field,
              published: ref.published,
              entity: owner.entity,
              entityId: owner.id,
              label: owner.label,
            })),
          )
        return run(tx, assets)
      })
    } catch (error) {
      await this.cleanup(created)
      throw error
    }
  }
}
