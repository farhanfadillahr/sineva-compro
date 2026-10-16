import 'server-only'
import { and, eq } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { cacheTags } from '../../lib/cache/tags'
import { writeAudit } from '../audit/service.server'
import type { ContentLocale, PageKey } from '../content/types'
import { CmsError } from '../cms/errors'
import { changedKeys, collectMedia, parseFields } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { revalidateContent } from '../cms/revalidate.server'
import { editorSections, PAGE_ROUTES, pageSchemas } from './fields'
import { currentPageVersion, migrateDocument, pageMigrations } from './migrations'
import { launchPage, type StoredPage } from './launch'
import { pageContent } from './schema'

const isLocale = (value: unknown): value is ContentLocale =>
  typeof value === 'string' && (routing.locales as readonly string[]).includes(value)

export async function readPage(
  database: Database | DatabaseTransaction,
  key: PageKey,
  locale: string,
  lock = false,
) {
  const query = database
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageKey, key), eq(pageContent.locale, locale)))
  const [row] = lock ? await query.for('update') : await query
  if (!row) return null
  return {
    data: migrateDocument(row.data as StoredPage, row.version, pageMigrations[key] ?? []),
    version: row.version,
    updatedAt: row.updatedAt,
  }
}

function complete(key: PageKey, data: unknown) {
  return parseFields(pageSchemas[key], data).ok
}

export async function listPagesForAdmin(headers: Headers) {
  await cmsReader(headers)
  const rows = await db.select().from(pageContent)
  return PAGE_ROUTES.map((route) => ({
    ...route,
    locales: routing.locales.map((locale) => {
      const row = rows.find((r) => r.pageKey === route.key && r.locale === locale)
      const data = row
        ? migrateDocument(row.data as StoredPage, row.version, pageMigrations[route.key] ?? [])
        : null
      return {
        locale,
        stored: !!row,
        complete: data ? complete(route.key, data) : false,
        updatedAt: row?.updatedAt.toISOString() ?? null,
      }
    }),
  }))
}

export async function loadPageForAdmin(headers: Headers, key: PageKey) {
  const actor = await cmsReader(headers)
  const locales: Record<
    string,
    { data: StoredPage | null; stored: boolean; updatedAt: string | null }
  > = {}
  for (const locale of routing.locales) {
    const row = await readPage(db, key, locale)
    locales[locale] = {
      data: row?.data ?? launchPage(key, locale),
      stored: !!row,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    }
  }
  return { actor, locales }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Saves one locale of a page. Only the given sections are taken from the submission; the rest keep
 * their stored values (the SEO panel saves `seo` on its own). Pages save as published in v1.
 */
export async function savePage(
  headers: Headers,
  key: PageKey,
  payload: unknown,
  sections: readonly string[] = editorSections(key),
): Promise<void> {
  const reader = await cmsReader(headers)
  const input = isRecord(payload) ? payload : {}
  if (!isLocale(input.locale)) throw new CmsError('INVALID', 'Bahasa tidak valid.')
  const locale = input.locale
  const submitted = isRecord(input.data) ? input.data : {}
  const route = PAGE_ROUTES.find((r) => r.key === key)!

  const parse = (previous: StoredPage | null, isAdmin: boolean) => {
    const base = previous ?? launchPage(key, locale) ?? {}
    const merged = {
      ...base,
      ...Object.fromEntries(sections.filter((s) => s in submitted).map((s) => [s, submitted[s]])),
    }
    const result = parseFields<StoredPage>(pageSchemas[key], merged, { isAdmin, previous: base })
    if (!result.ok)
      throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', result.errors)
    return { before: previous, after: result.value }
  }
  const draft = parse((await readPage(db, key, locale))?.data ?? null, reader.role === 'admin')
  await cmsMutation({
    headers,
    media: {
      owner: { entity: 'pages', id: `${key}:${locale}`, label: `Halaman ${route.label}` },
      refs: collectMedia(pageSchemas[key], draft.after).map((ref) => ({ ...ref, published: true })),
    },
    run: async (tx, actor) => {
      const current = await readPage(tx, key, locale, true)
      const next = parse(current?.data ?? null, actor.role === 'admin')
      const changed = next.before ? changedKeys(next.before, next.after) : Object.keys(next.after)
      if (!changed.length) return
      const now = new Date()
      const values = {
        version: currentPageVersion(key),
        data: next.after,
        updatedBy: actor.id,
        updatedAt: now,
      }
      await tx
        .insert(pageContent)
        .values({ pageKey: key, locale, ...values })
        .onConflictDoUpdate({ target: [pageContent.pageKey, pageContent.locale], set: values })
      await writeAudit(tx, actor, {
        entity: 'pages',
        entityId: `${key}:${locale}`,
        action: current ? 'update' : 'create',
        changedFields: auditFieldsFor(changed, next.before, next.after),
      })
    },
  })
  revalidateContent([cacheTags.page(key, locale), cacheTags.sitemap])
}

const visibleOf = (doc: StoredPage | null, section: string) => {
  const value = doc?.[section]
  return isRecord(value) ? value.visible : undefined
}

/** Audit names for changed sections: `seo`, `visibility` for a section switch, `data` otherwise. */
function auditFieldsFor(changed: string[], before: StoredPage | null, after: StoredPage) {
  const fields = new Set<string>()
  for (const section of changed) {
    if (section === 'seo') fields.add('seo')
    else if (visibleOf(before, section) !== visibleOf(after, section)) fields.add('visibility')
    else fields.add('data')
  }
  return [...fields]
}
