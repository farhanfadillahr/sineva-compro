import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, asc, eq, inArray, max, ne, sql } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { cacheTags } from '../../lib/cache/tags'
import { writeAudit } from '../audit/service.server'
import type { ContentLocale } from '../content/types'
import { CmsError } from '../cms/errors'
import { changedKeys, collectMedia, parseFields, type FieldErrors } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { revalidateContent } from '../cms/revalidate.server'
import { serviceGlobalSchema, serviceLocaleSchema, serviceSlugField } from './fields'
import { service, serviceTranslation } from './schema'

export type ServiceItem = {
  id: string
  sortOrder: number
  published: boolean
  isDemo: boolean
  global: Record<string, unknown>
  locales: Record<string, { slug: string; data: Record<string, unknown> } | undefined>
  updatedAt: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const notFound = () => new CmsError('NOT_FOUND', 'Layanan tidak ditemukan.')
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export async function readServices(
  database: Database | DatabaseTransaction,
  locales: readonly string[] = routing.locales,
  options: { lock?: boolean } = {},
): Promise<ServiceItem[]> {
  const query = database.select().from(service).orderBy(asc(service.sortOrder), asc(service.id))
  const rows = options.lock ? await query.for('update') : await query
  if (!rows.length) return []
  const localized = await database
    .select()
    .from(serviceTranslation)
    .where(
      and(
        inArray(
          serviceTranslation.serviceId,
          rows.map((r) => r.id),
        ),
        inArray(serviceTranslation.locale, [...locales]),
      ),
    )
  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    published: row.published,
    isDemo: row.isDemo,
    global: row.data as Record<string, unknown>,
    locales: Object.fromEntries(
      localized
        .filter((t) => t.serviceId === row.id)
        .map((t) => [t.locale, { slug: t.slug, data: t.data as Record<string, unknown> }]),
    ),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function listServicesForAdmin(headers: Headers) {
  const actor = await cmsReader(headers)
  return { actor, items: await readServices(db) }
}

export async function getServiceForAdmin(headers: Headers, id: string) {
  const actor = await cmsReader(headers)
  const item = UUID.test(id) ? (await readServices(db)).find((i) => i.id === id) : undefined
  if (!item) throw notFound()
  return { actor, item }
}

function prefixed(errors: FieldErrors, prefix: string): FieldErrors {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${prefix}${k}`, v]))
}

/** `{ id?, published, global, locales: { <locale>: { slug, ...content } | null } }` */
function parseService(input: unknown, isAdmin: boolean, previous?: ServiceItem) {
  const data = isRecord(input) ? input : {}
  const errors: FieldErrors = {}
  const global = parseFields<Record<string, unknown>>(serviceGlobalSchema, data.global ?? {}, {
    isAdmin,
    previous: previous?.global,
  })
  if (!global.ok) Object.assign(errors, prefixed(global.errors, 'global.'))
  const submitted = isRecord(data.locales) ? data.locales : {}
  const locales: Record<string, { slug: string; data: Record<string, unknown> }> = {}
  for (const locale of routing.locales) {
    const value = submitted[locale]
    if (!isRecord(value)) continue
    const slug = parseFields<string>(serviceSlugField, value.slug)
    if (!slug.ok) errors[`locales.${locale}.slug`] = Object.values(slug.errors)[0]
    const content = parseFields<Record<string, unknown>>(serviceLocaleSchema, value, {
      isAdmin,
      previous: previous?.locales[locale]?.data,
    })
    if (!content.ok) Object.assign(errors, prefixed(content.errors, `locales.${locale}.`))
    if (slug.ok && content.ok) locales[locale] = { slug: slug.value, data: content.value }
  }
  if (!Object.keys(locales).length && !Object.keys(errors).length)
    errors.locales = 'Isi minimal satu bahasa.'
  if (Object.keys(errors).length)
    throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', errors)
  return {
    published: data.published === true,
    global: global.ok ? global.value : {},
    locales,
  }
}

function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause
  return (error as { code?: string })?.code === '23505' || cause?.code === '23505'
}

function tagsFor(slugs: Iterable<string>) {
  return routing.locales.flatMap((locale) => [
    cacheTags.services(locale),
    ...[...slugs].map((slug) => cacheTags.service(slug, locale)),
  ])
}

/** Creates (no `id`) or updates a service. Returns its id. */
export async function saveService(headers: Headers, payload: unknown): Promise<string> {
  const reader = await cmsReader(headers)
  const input = isRecord(payload) ? payload : {}
  const existingId = typeof input.id === 'string' && input.id ? input.id : null
  if (existingId && !UUID.test(existingId)) throw notFound()
  const previous = existingId
    ? (await readServices(db)).find((i) => i.id === existingId)
    : undefined
  if (existingId && !previous) throw notFound()
  const draft = parseService(input, reader.role === 'admin', previous)
  const id = existingId ?? randomUUID()
  const slugs = new Set<string>()
  try {
    await cmsMutation({
      headers,
      media: {
        owner: { entity: 'services', id: `services:${id}`, label: 'Layanan' },
        refs: Object.entries(draft.locales).flatMap(([locale, value]) =>
          collectMedia(serviceLocaleSchema, value.data, `locales.${locale}`).map((ref) => ({
            ...ref,
            published: draft.published,
          })),
        ),
      },
      run: async (tx, actor) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('service', 0))`)
        const current = existingId
          ? (await readServices(tx, routing.locales, { lock: true })).find(
              (i) => i.id === existingId,
            )
          : undefined
        if (existingId && !current) throw notFound()
        const next = parseService(input, actor.role === 'admin', current)
        for (const [locale, value] of Object.entries(next.locales)) {
          const [taken] = await tx
            .select({ id: serviceTranslation.serviceId })
            .from(serviceTranslation)
            .where(
              and(
                eq(serviceTranslation.locale, locale),
                eq(serviceTranslation.slug, value.slug),
                ne(serviceTranslation.serviceId, id),
              ),
            )
          if (taken)
            throw new CmsError('CONFLICT', 'Slug sudah dipakai layanan lain.', {
              [`locales.${locale}.slug`]: 'Slug sudah dipakai layanan lain.',
            })
        }
        const now = new Date()
        let changed: string[]
        if (!current) {
          const [{ last }] = await tx.select({ last: max(service.sortOrder) }).from(service)
          await tx.insert(service).values({
            id,
            sortOrder: (last ?? -1) + 1,
            published: next.published,
            data: next.global,
            updatedBy: actor.id,
            updatedAt: now,
          })
          changed = [
            'published',
            'slug',
            ...Object.keys(next.global),
            ...Object.keys(serviceLocaleSchema.fields),
          ]
        } else {
          changed = [
            ...(current.published !== next.published ? ['published'] : []),
            ...changedKeys(current.global, next.global),
            ...routing.locales.flatMap((l) => [
              ...(current.locales[l]?.slug !== next.locales[l]?.slug ? ['slug'] : []),
              ...changedKeys(current.locales[l]?.data ?? {}, next.locales[l]?.data ?? {}),
            ]),
          ]
          if (!changed.length) return
          await tx
            .update(service)
            .set({
              published: next.published,
              data: next.global,
              updatedBy: actor.id,
              updatedAt: now,
            })
            .where(eq(service.id, id))
          for (const value of Object.values(current.locales)) if (value) slugs.add(value.slug)
        }
        for (const locale of routing.locales) {
          const value = next.locales[locale]
          if (value) {
            slugs.add(value.slug)
            await tx
              .insert(serviceTranslation)
              .values({ serviceId: id, locale, slug: value.slug, data: value.data })
              .onConflictDoUpdate({
                target: [serviceTranslation.serviceId, serviceTranslation.locale],
                set: { slug: value.slug, data: value.data },
              })
          } else
            await tx
              .delete(serviceTranslation)
              .where(
                and(eq(serviceTranslation.serviceId, id), eq(serviceTranslation.locale, locale)),
              )
        }
        await writeAudit(tx, actor, {
          entity: 'services',
          entityId: `services:${id}`,
          action: current ? 'update' : 'create',
          changedFields: [...new Set(changed)],
        })
      },
    })
  } catch (error) {
    // The advisory lock serialises saves; the constraint still guards any other writer.
    if (isUniqueViolation(error))
      throw new CmsError('CONFLICT', 'Slug sudah dipakai layanan lain.', {
        [`locales.${routing.defaultLocale}.slug`]: 'Slug sudah dipakai layanan lain.',
      })
    throw error
  }
  revalidateContent([...tagsFor(slugs), cacheTags.sitemap, cacheTags.settings])
  return id
}

export async function setServicePublished(headers: Headers, id: string, published: boolean) {
  const { item } = await getServiceForAdmin(headers, id)
  await saveService(headers, {
    id,
    published,
    global: item.global,
    locales: Object.fromEntries(
      Object.entries(item.locales).map(([locale, value]) => [
        locale,
        value ? { slug: value.slug, ...value.data } : null,
      ]),
    ),
  })
}

export async function reorderServices(headers: Headers, ids: unknown) {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !UUID.test(id)))
    throw new CmsError('INVALID', 'Urutan tidak valid.')
  await cmsMutation({
    headers,
    run: async (tx, actor) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('service', 0))`)
      const rows = await tx.select({ id: service.id }).from(service).for('update')
      const current = new Set(rows.map((r) => r.id))
      if (
        ids.length !== current.size ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !current.has(id))
      )
        throw new CmsError('CONFLICT', 'Daftar berubah sejak dibuka. Muat ulang lalu urutkan lagi.')
      for (const [index, id] of (ids as string[]).entries())
        await tx.update(service).set({ sortOrder: index }).where(eq(service.id, id))
      await writeAudit(tx, actor, {
        entity: 'services',
        entityId: 'services',
        action: 'update',
        changedFields: ['order'],
      })
    },
  })
  revalidateContent([...tagsFor([]), cacheTags.settings])
}

/** Removes an unpublished service. A published one must be unpublished first. */
export async function deleteService(headers: Headers, id: string) {
  if (!UUID.test(id)) throw notFound()
  const slugs: string[] = []
  await cmsMutation({
    headers,
    media: { owner: { entity: 'services', id: `services:${id}`, label: 'Layanan' }, refs: [] },
    run: async (tx, actor) => {
      const [row] = await tx.select().from(service).where(eq(service.id, id)).for('update')
      if (!row) throw notFound()
      if (row.published)
        throw new CmsError('CONFLICT', 'Batalkan publikasi layanan sebelum menghapusnya.')
      for (const t of await tx
        .select({ slug: serviceTranslation.slug })
        .from(serviceTranslation)
        .where(eq(serviceTranslation.serviceId, id)))
        slugs.push(t.slug)
      await tx.delete(service).where(eq(service.id, id))
      await writeAudit(tx, actor, {
        entity: 'services',
        entityId: `services:${id}`,
        action: 'delete',
        changedFields: ['slug'],
      })
    },
  })
  revalidateContent([...tagsFor(slugs), cacheTags.sitemap, cacheTags.settings])
}

/** Published services with a translation for the locale, in order. */
export async function publishedServices(
  database: Database | DatabaseTransaction,
  locale: ContentLocale,
) {
  return (await readServices(database, [locale])).flatMap((item) => {
    const local = item.locales[locale]
    if (!item.published || !local) return []
    const global = parseFields<Record<string, unknown>>(serviceGlobalSchema, item.global)
    const content = parseFields<Record<string, unknown>>(serviceLocaleSchema, local.data)
    if (!global.ok || !content.ok) {
      console.error(`Service ${local.slug} does not match its schema.`)
      return []
    }
    return [{ id: item.id, slug: local.slug, global: global.value, local: content.value }]
  })
}
