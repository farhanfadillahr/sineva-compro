import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, asc, eq, inArray, max, sql } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { writeAudit } from '../audit/service.server'
import type { ContentLocale } from '../content/types'
import { CmsError } from '../cms/errors'
import { changedKeys, collectMedia, parseFields, type FieldErrors } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { revalidateChange } from '../cms/revalidate.server'
import { collectionConfigs, keyField, type CollectionItem, type CollectionName } from './configs'
import { collectionRegistry } from './registry'

type Row = {
  id: string
  key: string
  sortOrder: number
  isDemo: boolean
  data: unknown
  updatedAt: Date
}

/** Every item of a collection with all its translations, in display order. */
export async function readCollection(
  database: Database | DatabaseTransaction,
  name: CollectionName,
  locales: readonly string[] = routing.locales,
): Promise<CollectionItem[]> {
  const { items, translations } = collectionRegistry[name].tables
  const rows: Row[] = await database
    .select()
    .from(items)
    .orderBy(asc(items.sortOrder), asc(items.id))
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
    key: row.key,
    sortOrder: row.sortOrder,
    isDemo: row.isDemo,
    global: row.data as Record<string, unknown>,
    locales: Object.fromEntries(
      localized
        .filter((t) => t.itemId === row.id)
        .map((t) => [t.locale, t.data as Record<string, unknown>]),
    ),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function listCollectionForAdmin(headers: Headers, name: CollectionName) {
  const actor = await cmsReader(headers)
  return { actor, items: await readCollection(db, name) }
}

export async function getCollectionItemForAdmin(
  headers: Headers,
  name: CollectionName,
  id: string,
) {
  const actor = await cmsReader(headers)
  const item = (await readCollection(db, name)).find((i) => i.id === id)
  if (!item)
    throw new CmsError('NOT_FOUND', `${collectionConfigs[name].itemLabel} tidak ditemukan.`)
  return { actor, item }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function prefixed(errors: FieldErrors, prefix: string): FieldErrors {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${prefix}${k}`, v]))
}

/** Validates a submitted item: `{ id?, key, global, locales: { <locale>: {...} } }`. */
function parseItem(
  name: CollectionName,
  input: unknown,
  isAdmin: boolean,
  previous?: CollectionItem,
) {
  const config = collectionConfigs[name]
  const data = isRecord(input) ? input : {}
  const errors: FieldErrors = {}
  const key = previous
    ? { ok: true as const, value: previous.key }
    : parseFields<string>(keyField, data.key)
  if (!key.ok) errors.key = Object.values(key.errors)[0]
  const global = parseFields<Record<string, unknown>>(config.globalSchema, data.global ?? {}, {
    isAdmin,
    previous: previous?.global,
  })
  if (!global.ok) Object.assign(errors, prefixed(global.errors, 'global.'))
  const submitted = isRecord(data.locales) ? data.locales : {}
  const locales: Record<string, Record<string, unknown>> = {}
  for (const locale of routing.locales) {
    // A locale left empty is not published for that locale (no cross-locale fallback).
    if (!(locale in submitted) || submitted[locale] === null) continue
    const local = parseFields<Record<string, unknown>>(config.localeSchema, submitted[locale], {
      isAdmin,
      previous: previous?.locales[locale],
    })
    if (!local.ok) Object.assign(errors, prefixed(local.errors, `locales.${locale}.`))
    else locales[locale] = local.value
  }
  if (!Object.keys(locales).length && !Object.keys(errors).length)
    errors['locales'] = 'Isi minimal satu bahasa.'
  if (Object.keys(errors).length)
    throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', errors)
  return { key: key.ok ? key.value : '', global: global.ok ? global.value : {}, locales }
}

function mediaRefs(name: CollectionName, parsed: ReturnType<typeof parseItem>) {
  const config = collectionConfigs[name]
  return [
    ...collectMedia(config.globalSchema, parsed.global, 'global'),
    ...Object.entries(parsed.locales).flatMap(([locale, value]) =>
      collectMedia(config.localeSchema, value, `locales.${locale}`),
    ),
  ].map((ref) => ({ ...ref, published: true }))
}

function auditNames(name: CollectionName, keys: string[]) {
  const names = collectionConfigs[name].auditNames ?? {}
  return [...new Set(keys.map((key) => names[key] ?? key))]
}

/** Creates (no `id`) or updates an item. Returns the item id. */
export async function saveCollectionItem(
  headers: Headers,
  name: CollectionName,
  payload: unknown,
): Promise<string> {
  const config = collectionConfigs[name]
  const { items, translations } = collectionRegistry[name].tables
  const reader = await cmsReader(headers)
  const input = isRecord(payload) ? payload : {}
  const existingId = typeof input.id === 'string' && input.id ? input.id : null
  if (existingId && !UUID.test(existingId))
    throw new CmsError('NOT_FOUND', `${config.itemLabel} tidak ditemukan.`)
  const all = await readCollection(db, name)
  const previous = existingId ? all.find((i) => i.id === existingId) : undefined
  if (existingId && !previous)
    throw new CmsError('NOT_FOUND', `${config.itemLabel} tidak ditemukan.`)
  const draft = parseItem(name, input, reader.role === 'admin', previous)
  const id = existingId ?? randomUUID()

  await cmsMutation({
    headers,
    media: {
      owner: {
        entity: config.mediaEntity,
        id: `${name}:${id}`,
        label: `${config.itemLabel}: ${draft.key}`,
      },
      refs: mediaRefs(name, draft),
    },
    run: async (tx, actor) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`collection:${name}`}, 0))`,
      )
      const current = existingId
        ? (await readCollection(tx, name)).find((i) => i.id === existingId)
        : undefined
      if (existingId && !current)
        throw new CmsError('NOT_FOUND', `${config.itemLabel} tidak ditemukan.`)
      const next = parseItem(name, input, actor.role === 'admin', current)
      const now = new Date()
      let changed: string[]
      if (!current) {
        const [taken] = await tx.select({ id: items.id }).from(items).where(eq(items.key, next.key))
        if (taken)
          throw new CmsError('CONFLICT', 'Kunci sudah dipakai.', {
            key: 'Kunci sudah dipakai item lain.',
          })
        const [{ last }] = await tx.select({ last: max(items.sortOrder) }).from(items)
        await tx.insert(items).values({
          id,
          key: next.key,
          sortOrder: (last ?? -1) + 1,
          data: next.global,
          updatedBy: actor.id,
          updatedAt: now,
        })
        changed = [
          'key',
          ...Object.keys(next.global),
          ...Object.values(next.locales).flatMap(Object.keys),
        ]
      } else {
        changed = [
          ...changedKeys(current.global, next.global),
          ...routing.locales.flatMap((l) =>
            changedKeys(current.locales[l] ?? {}, next.locales[l] ?? {}),
          ),
        ]
        if (!changed.length) return
        await tx
          .update(items)
          .set({ data: next.global, updatedBy: actor.id, updatedAt: now })
          .where(eq(items.id, id))
      }
      for (const locale of routing.locales) {
        const value = next.locales[locale]
        if (value)
          await tx
            .insert(translations)
            .values({ itemId: id, locale, data: value })
            .onConflictDoUpdate({
              target: [translations.itemId, translations.locale],
              set: { data: value },
            })
        else
          await tx
            .delete(translations)
            .where(and(eq(translations.itemId, id), eq(translations.locale, locale)))
      }
      await writeAudit(tx, actor, {
        entity: config.audit,
        entityId: `${name}:${id}`,
        action: current ? 'update' : 'create',
        changedFields: auditNames(name, changed),
      })
    },
  })
  revalidateChange({ entity: collectionRegistry[name].entity })
  return id
}

export async function deleteCollectionItem(headers: Headers, name: CollectionName, id: string) {
  const config = collectionConfigs[name]
  const { items } = collectionRegistry[name].tables
  if (!UUID.test(id)) throw new CmsError('NOT_FOUND', `${config.itemLabel} tidak ditemukan.`)
  await cmsMutation({
    headers,
    media: {
      owner: { entity: config.mediaEntity, id: `${name}:${id}`, label: config.itemLabel },
      refs: [],
    },
    run: async (tx, actor) => {
      const [current] = await tx.select().from(items).where(eq(items.id, id)).for('update')
      if (!current) throw new CmsError('NOT_FOUND', `${config.itemLabel} tidak ditemukan.`)
      const blocked = await collectionRegistry[name].inUse?.(tx, current)
      if (blocked) throw new CmsError('CONFLICT', blocked)
      await tx.delete(items).where(eq(items.id, id))
      await writeAudit(tx, actor, {
        entity: config.audit,
        entityId: `${name}:${id}`,
        action: 'delete',
        changedFields: auditNames(name, ['key']),
      })
    },
  })
  revalidateChange({ entity: collectionRegistry[name].entity })
}

/** Sets the display order to the given id order. The list must contain every item exactly once. */
export async function reorderCollection(headers: Headers, name: CollectionName, ids: unknown) {
  const config = collectionConfigs[name]
  const { items } = collectionRegistry[name].tables
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !UUID.test(id)))
    throw new CmsError('INVALID', 'Urutan tidak valid.')
  await cmsMutation({
    headers,
    run: async (tx, actor) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`collection:${name}`}, 0))`,
      )
      const rows = await tx.select({ id: items.id }).from(items).for('update')
      const current = new Set(rows.map((r) => r.id))
      if (
        ids.length !== current.size ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !current.has(id))
      )
        throw new CmsError(
          'CONFLICT',
          'Daftar berubah sejak dibuka. Muat ulang halaman lalu urutkan lagi.',
        )
      for (const [index, id] of (ids as string[]).entries())
        await tx.update(items).set({ sortOrder: index }).where(eq(items.id, id))
      await writeAudit(tx, actor, {
        entity: config.audit,
        entityId: name,
        action: 'update',
        changedFields: auditNames(name, ['order']),
      })
    },
  })
  revalidateChange({ entity: collectionRegistry[name].entity })
}

/** Public rows for one locale: items with a valid translation, in order. */
export async function publicCollection(
  database: Database | DatabaseTransaction,
  name: CollectionName,
  locale: ContentLocale,
) {
  const config = collectionConfigs[name]
  return (await readCollection(database, name, [locale])).flatMap((item) => {
    const local = item.locales[locale]
    if (!local) return []
    const global = parseFields<Record<string, unknown>>(config.globalSchema, item.global)
    const localized = parseFields<Record<string, unknown>>(config.localeSchema, local)
    if (!global.ok || !localized.ok) {
      console.error(`Collection ${name} item ${item.key} does not match its schema.`)
      return []
    }
    return [{ id: item.id, key: item.key, global: global.value, local: localized.value }]
  })
}
