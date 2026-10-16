import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, asc, eq, inArray, ne, or, sql } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { writeAudit } from '../audit/service.server'
import type { ContentLocale } from '../content/types'
import { CmsError } from '../cms/errors'
import { changedKeys, collectMedia, parseFields, type FieldErrors } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { revalidateContent } from '../cms/revalidate.server'
import { documentConfigs, documentSlugField, type DocumentItem, type DocumentName } from './configs'
import { documentRegistry } from './registry.server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isLocale = (value: unknown): value is ContentLocale =>
  typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
const notFound = (name: DocumentName) =>
  new CmsError('NOT_FOUND', `${documentConfigs[name].itemLabel} tidak ditemukan.`)

export async function readDocuments(
  database: Database | DatabaseTransaction,
  name: DocumentName,
  locales: readonly string[] = routing.locales,
  options: { ids?: string[]; lock?: boolean } = {},
): Promise<DocumentItem[]> {
  const { items, translations } = documentRegistry[name].tables
  const query = database
    .select()
    .from(items)
    .where(options.ids ? inArray(items.id, options.ids) : undefined)
    .orderBy(asc(items.sortOrder), asc(items.createdAt), asc(items.id))
  const rows = options.lock ? await query.for('update') : await query
  if (!rows.length) return []
  const localized = await database
    .select()
    .from(translations)
    .where(
      and(
        inArray(
          translations.itemId,
          rows.map((r) => r.id),
        ),
        inArray(translations.locale, [...locales]),
      ),
    )
  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    isDemo: row.isDemo,
    updatedAt: row.updatedAt.toISOString(),
    locales: Object.fromEntries(
      localized
        .filter((t) => t.itemId === row.id)
        .map((t) => [
          t.locale,
          {
            draftSlug: t.draftSlug,
            draft: t.draft as Record<string, unknown>,
            draftUpdatedAt: t.draftUpdatedAt.toISOString(),
            publishedSlug: t.publishedSlug,
            published: (t.published as Record<string, unknown> | null) ?? null,
            firstPublishedAt: t.firstPublishedAt?.toISOString() ?? null,
            lastPublishedAt: t.lastPublishedAt?.toISOString() ?? null,
          },
        ]),
    ),
  }))
}

export async function listDocumentsForAdmin(headers: Headers, name: DocumentName) {
  const actor = await cmsReader(headers)
  return { actor, items: await readDocuments(db, name) }
}

export async function getDocumentForAdmin(headers: Headers, name: DocumentName, id: string) {
  const actor = await cmsReader(headers)
  const [item] = UUID.test(id) ? await readDocuments(db, name, routing.locales, { ids: [id] }) : []
  if (!item) throw notFound(name)
  return { actor, item }
}

function prefixed(errors: FieldErrors, prefix: string): FieldErrors {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${prefix}${k}`, v]))
}

/** Validates a draft submission `{ id?, locale, slug, data }`. Drafts may be incomplete. */
function parseDraft(name: DocumentName, input: unknown, isAdmin: boolean, previous?: unknown) {
  const data = isRecord(input) ? input : {}
  if (!isLocale(data.locale)) throw new CmsError('INVALID', 'Bahasa tidak valid.')
  const errors: FieldErrors = {}
  const slug = parseFields<string>(documentSlugField, data.slug)
  if (!slug.ok) errors.slug = Object.values(slug.errors)[0]
  const content = parseFields<Record<string, unknown>>(documentConfigs[name].schema, data.data, {
    isAdmin,
    previous,
    partial: true,
  })
  if (!content.ok) Object.assign(errors, prefixed(content.errors, 'data.'))
  if (Object.keys(errors).length)
    throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', errors)
  return {
    locale: data.locale,
    slug: slug.ok ? slug.value : '',
    data: content.ok ? content.value : {},
  }
}

async function assertSlugFree(
  tx: DatabaseTransaction,
  name: DocumentName,
  id: string,
  locale: string,
  slug: string,
) {
  const { translations } = documentRegistry[name].tables
  const [taken] = await tx
    .select({ id: translations.itemId })
    .from(translations)
    .where(
      and(
        eq(translations.locale, locale),
        ne(translations.itemId, id),
        or(eq(translations.draftSlug, slug), eq(translations.publishedSlug, slug)),
      ),
    )
  if (taken)
    throw new CmsError('CONFLICT', 'Slug sudah dipakai.', { slug: 'Slug sudah dipakai item lain.' })
}

function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause
  return (error as { code?: string })?.code === '23505' || cause?.code === '23505'
}

async function guarded<T>(run: () => Promise<T>) {
  try {
    return await run()
  } catch (error) {
    if (isUniqueViolation(error))
      throw new CmsError('CONFLICT', 'Slug sudah dipakai.', {
        slug: 'Slug sudah dipakai item lain.',
      })
    throw error
  }
}

/** Saves the draft of one locale. Never touches the published snapshot. Returns the id. */
export async function saveDraft(
  headers: Headers,
  name: DocumentName,
  payload: unknown,
): Promise<string> {
  const config = documentConfigs[name]
  const { items, translations } = documentRegistry[name].tables
  const reader = await cmsReader(headers)
  const input = isRecord(payload) ? payload : {}
  const existingId = typeof input.id === 'string' && input.id ? input.id : null
  if (existingId && !UUID.test(existingId)) throw notFound(name)
  const draft = parseDraft(name, input, reader.role === 'admin')
  const id = existingId ?? randomUUID()
  await guarded(() =>
    cmsMutation({
      headers,
      media: {
        owner: {
          entity: config.mediaEntity,
          id: `${name}:${id}:${draft.locale}:draft`,
          label: `${config.itemLabel} (draf)`,
        },
        refs: collectMedia(config.schema, draft.data).map((ref) => ({ ...ref, published: false })),
      },
      run: async (tx, actor) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`document:${name}`}, 0))`,
        )
        const [current] = existingId
          ? await readDocuments(tx, name, [draft.locale], { ids: [existingId], lock: true })
          : []
        if (existingId && !current) throw notFound(name)
        const previous = current?.locales[draft.locale]
        const next = parseDraft(name, input, actor.role === 'admin', previous?.draft)
        await documentRegistry[name].validateRefs?.(tx, next.data, next.locale, true)
        await assertSlugFree(tx, name, id, next.locale, next.slug)
        const changed = previous
          ? [
              ...(previous.draftSlug !== next.slug ? ['slug'] : []),
              ...changedKeys(previous.draft, next.data),
            ]
          : ['slug', ...Object.keys(next.data)]
        if (!changed.length) return
        const now = new Date()
        if (!current) await tx.insert(items).values({ id, updatedBy: actor.id, updatedAt: now })
        else
          await tx
            .update(items)
            .set({ updatedBy: actor.id, updatedAt: now })
            .where(eq(items.id, id))
        await tx
          .insert(translations)
          .values({
            itemId: id,
            locale: next.locale,
            draftSlug: next.slug,
            draft: next.data,
            draftUpdatedAt: now,
          })
          .onConflictDoUpdate({
            target: [translations.itemId, translations.locale],
            set: { draftSlug: next.slug, draft: next.data, draftUpdatedAt: now },
          })
        await writeAudit(tx, actor, {
          entity: config.audit,
          entityId: `${name}:${id}:${next.locale}`,
          action: current ? 'update' : 'create',
          changedFields: documentRegistry[name].auditFields(changed),
        })
      },
    }),
  )
  return id
}

/**
 * Publishes the current draft of one locale as its snapshot, fully validated, in one transaction
 * with the media publication and the audit entry.
 */
export async function publishDocument(
  headers: Headers,
  name: DocumentName,
  id: string,
  locale: unknown,
): Promise<void> {
  const config = documentConfigs[name]
  const { translations } = documentRegistry[name].tables
  if (!UUID.test(id)) throw notFound(name)
  if (!isLocale(locale)) throw new CmsError('INVALID', 'Bahasa tidak valid.')
  const { item } = await getDocumentForAdmin(headers, name, id)
  const preview = item.locales[locale]
  if (!preview) throw new CmsError('INVALID', 'Belum ada draf untuk bahasa ini.')
  const full = parseFields<Record<string, unknown>>(config.schema, preview.draft)
  if (!full.ok)
    throw new CmsError(
      'INVALID',
      'Draf belum lengkap untuk diterbitkan.',
      prefixed(full.errors, 'data.'),
    )
  const oldSlug = preview.publishedSlug
  await guarded(() =>
    cmsMutation({
      headers,
      media: {
        owner: {
          entity: config.mediaEntity,
          id: `${name}:${id}:${locale}`,
          label: config.itemLabel,
        },
        refs: collectMedia(config.schema, full.value).map((ref) => ({ ...ref, published: true })),
      },
      run: async (tx, actor) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${`document:${name}`}, 0))`,
        )
        const [current] = await readDocuments(tx, name, [locale], { ids: [id], lock: true })
        const local = current?.locales[locale]
        if (!local) throw notFound(name)
        const parsed = parseFields<Record<string, unknown>>(config.schema, local.draft)
        if (!parsed.ok)
          throw new CmsError(
            'INVALID',
            'Draf belum lengkap untuk diterbitkan.',
            prefixed(parsed.errors, 'data.'),
          )
        await documentRegistry[name].validateRefs?.(tx, parsed.value, locale, false)
        await assertSlugFree(tx, name, id, locale, local.draftSlug)
        const changed =
          local.published && local.publishedSlug === local.draftSlug
            ? changedKeys(local.published, parsed.value)
            : ['slug', ...Object.keys(parsed.value)]
        const now = new Date()
        await tx
          .update(translations)
          .set({
            published: parsed.value,
            publishedSlug: local.draftSlug,
            firstPublishedAt: local.firstPublishedAt ? new Date(local.firstPublishedAt) : now,
            // Republishing an identical snapshot is not an edit.
            lastPublishedAt: changed.length
              ? now
              : local.lastPublishedAt
                ? new Date(local.lastPublishedAt)
                : now,
          })
          .where(and(eq(translations.itemId, id), eq(translations.locale, locale)))
        await documentRegistry[name].afterPublish?.(tx, actor, {
          locale,
          oldSlug: local.publishedSlug,
          newSlug: local.draftSlug,
        })
        await writeAudit(tx, actor, {
          entity: config.audit,
          entityId: `${name}:${id}:${locale}`,
          action: 'publish',
          changedFields: documentRegistry[name].auditFields(['published', ...changed]),
        })
      },
    }),
  )
  revalidateContent(documentRegistry[name].tags(locale, [oldSlug, preview.draftSlug]))
}

export async function unpublishDocument(
  headers: Headers,
  name: DocumentName,
  id: string,
  locale: unknown,
): Promise<void> {
  const config = documentConfigs[name]
  const { translations } = documentRegistry[name].tables
  if (!UUID.test(id)) throw notFound(name)
  if (!isLocale(locale)) throw new CmsError('INVALID', 'Bahasa tidak valid.')
  let slug: string | null = null
  await cmsMutation({
    headers,
    media: {
      owner: { entity: config.mediaEntity, id: `${name}:${id}:${locale}`, label: config.itemLabel },
      refs: [],
    },
    run: async (tx, actor) => {
      const [current] = await readDocuments(tx, name, [locale], { ids: [id], lock: true })
      const local = current?.locales[locale]
      if (!local) throw notFound(name)
      if (!local.published) return
      slug = local.publishedSlug
      await tx
        .update(translations)
        .set({ published: null, publishedSlug: null })
        .where(and(eq(translations.itemId, id), eq(translations.locale, locale)))
      await writeAudit(tx, actor, {
        entity: config.audit,
        entityId: `${name}:${id}:${locale}`,
        action: 'unpublish',
        changedFields: documentRegistry[name].auditFields(['published']),
      })
    },
  })
  revalidateContent(documentRegistry[name].tags(locale, [slug]))
}

/** Deletes a document that has no published locale. */
export async function deleteDocument(headers: Headers, name: DocumentName, id: string) {
  const config = documentConfigs[name]
  const { items } = documentRegistry[name].tables
  if (!UUID.test(id)) throw notFound(name)
  await cmsMutation({
    headers,
    run: async (tx, actor) => {
      const [current] = await readDocuments(tx, name, routing.locales, { ids: [id], lock: true })
      if (!current) throw notFound(name)
      if (Object.values(current.locales).some((l) => l?.published))
        throw new CmsError('CONFLICT', 'Batalkan publikasi di semua bahasa sebelum menghapus.')
      const { mediaUsage } = await import('../media/schema')
      await tx
        .delete(mediaUsage)
        .where(
          and(
            eq(mediaUsage.entity, config.mediaEntity),
            sql`${mediaUsage.entityId} LIKE ${`${name}:${id}:%`}`,
          ),
        )
      await tx.delete(items).where(eq(items.id, id))
      await writeAudit(tx, actor, {
        entity: config.audit,
        entityId: `${name}:${id}`,
        action: 'delete',
        changedFields: documentRegistry[name].auditFields(['slug']),
      })
    },
  })
}

export type PublicDocument = {
  id: string
  slug: string
  data: Record<string, unknown>
  firstPublishedAt: string | null
  lastPublishedAt: string | null
}

/**
 * The site's view: published snapshots for one locale. With `preview`, the latest draft of every
 * document instead (authorised preview only; never cached).
 */
export async function publicDocuments(
  database: Database | DatabaseTransaction,
  name: DocumentName,
  locale: ContentLocale,
  preview = false,
): Promise<PublicDocument[]> {
  const schema = documentConfigs[name].schema
  return (await readDocuments(database, name, [locale])).flatMap((item) => {
    const local = item.locales[locale]
    if (!local) return []
    const source = preview ? local.draft : local.published
    const slug = preview ? local.draftSlug : local.publishedSlug
    if (!source || !slug) return []
    const parsed = parseFields<Record<string, unknown>>(schema, source, {
      isAdmin: true,
      partial: preview,
    })
    if (!parsed.ok) {
      console.error(`${name} ${slug} does not match its schema.`)
      return []
    }
    return [
      {
        id: item.id,
        slug,
        data: parsed.value,
        firstPublishedAt: local.firstPublishedAt,
        lastPublishedAt: local.lastPublishedAt,
      },
    ]
  })
}
