import 'server-only'
import { eq, inArray } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { staticContent, staticContentFor } from '../../content/static/source'
import { writeAudit } from '../audit/service.server'
import type { Principal } from '../auth/types'
import type { ContentLocale } from '../content/types'
import { CmsError } from '../cms/errors'
import { changedKeys, collectMedia, parseFields } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { revalidateChange } from '../cms/revalidate.server'
import {
  settingsGlobalSchema,
  settingsLocaleSchema,
  type SettingsGlobal,
  type SettingsLocale,
} from './fields'
import { alignServiceTemplates, settingsFromDto, validateSettingsLocale } from './project'
import { siteSettings, siteSettingsTranslation } from './schema'

export type StoredSettings = { global: SettingsGlobal; locales: Record<string, SettingsLocale> }

/**
 * Launch values, used when the singleton has not been seeded yet. `local` is the launch copy of
 * `locale`, or the default locale's when that locale has none.
 */
export function defaultSettings(locale: ContentLocale = routing.defaultLocale): {
  global: SettingsGlobal
  local: SettingsLocale
} {
  const { global } = settingsFromDto(staticContent.siteSettings)
  const { local } = settingsFromDto((staticContentFor(locale) ?? staticContent).siteSettings)
  return { global, local }
}

export async function readStoredSettings(
  database: Database | DatabaseTransaction,
  locales: readonly string[] = routing.locales,
  lock = false,
): Promise<{ global: SettingsGlobal | null; locales: Record<string, SettingsLocale> }> {
  const globalQuery = database.select().from(siteSettings).where(eq(siteSettings.id, 'site'))
  const localeQuery = database
    .select()
    .from(siteSettingsTranslation)
    .where(inArray(siteSettingsTranslation.locale, [...locales]))
  // Sequential, not Promise.all: `database` may be a transaction, which is one connection, and
  // overlapping queries on it are deprecated in pg (removed in pg 9).
  const [row] = lock ? await globalQuery.for('update') : await globalQuery
  const rows = lock ? await localeQuery.for('update') : await localeQuery
  return {
    global: (row?.data as SettingsGlobal | undefined) ?? null,
    locales: Object.fromEntries(rows.map((r) => [r.locale, r.data as SettingsLocale])),
  }
}

/** Services the WhatsApp templates are listed from: the public services of the active source. */
async function currentServices(locale: ContentLocale) {
  const { getContentSource } = await import('../../lib/content-source')
  return (await getContentSource().listServices(locale)).map(({ slug, title }) => ({ slug, title }))
}

export async function loadSettingsForAdmin(headers: Headers) {
  const actor = await cmsReader(headers)
  const stored = await readStoredSettings(db)
  const fallback = defaultSettings()
  const locales: Record<string, SettingsLocale> = {}
  const services: Record<string, { slug: string; title: string }[]> = {}
  for (const locale of routing.locales) {
    const local = stored.locales[locale] ?? defaultSettings(locale).local
    services[locale] = await currentServices(locale)
    locales[locale] = {
      ...local,
      whatsapp: {
        ...local.whatsapp,
        services: alignServiceTemplates(local.whatsapp.services, services[locale]),
      },
    }
  }
  return {
    actor,
    value: { global: stored.global ?? fallback.global, locales },
    services,
    seeded: !!stored.global,
  }
}

const LOCALE_AUDIT: Record<string, string> = {
  contact: 'businessHours',
  whatsapp: 'whatsappTemplates',
  seo: 'seo',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function pick(input: unknown, groups: readonly string[]) {
  const data = isRecord(input) ? input : {}
  return Object.fromEntries(groups.filter((group) => group in data).map((g) => [g, data[g]]))
}

/**
 * Saves the groups a settings page edits; every other group keeps its stored value. Admin-only
 * groups are taken from the stored value for an Editor (`parseFields`), so a crafted request
 * cannot change them.
 */
export async function saveSiteSettings(
  headers: Headers,
  payload: unknown,
  groups: { global: readonly string[]; locale: readonly string[] },
): Promise<void> {
  const reader = await cmsReader(headers)
  const isAdmin = reader.role === 'admin'
  const input = isRecord(payload) ? payload : {}
  const fallback = defaultSettings()

  const parse = (stored: Awaited<ReturnType<typeof readStoredSettings>>) => {
    const previousGlobal = stored.global ?? fallback.global
    const global = parseFields<SettingsGlobal>(
      settingsGlobalSchema,
      { ...previousGlobal, ...pick(input.global, groups.global) },
      { isAdmin, previous: previousGlobal },
    )
    const errors = global.ok ? {} : prefixed(global.errors, 'global.')
    const locales: Record<string, { before: SettingsLocale; after: SettingsLocale }> = {}
    const submitted = isRecord(input.locales) ? input.locales : {}
    for (const locale of routing.locales) {
      const before = stored.locales[locale] ?? defaultSettings(locale).local
      const local = parseFields<SettingsLocale>(
        settingsLocaleSchema,
        { ...before, ...pick(submitted[locale], groups.locale) },
        { isAdmin, previous: before },
      )
      if (!local.ok) Object.assign(errors, prefixed(local.errors, `locales.${locale}.`))
      else {
        Object.assign(errors, validateSettingsLocale(local.value, `locales.${locale}.`))
        locales[locale] = { before, after: local.value }
      }
    }
    if (!global.ok || Object.keys(errors).length)
      throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', errors)
    return { previousGlobal, global: global.value, locales, seeded: !!stored.global }
  }

  // Validate once outside the transaction to know which media to publish.
  const draft = parse(await readStoredSettings(db))
  const refs = collectMedia(settingsGlobalSchema, draft.global).map((ref) => ({
    ...ref,
    published: true,
  }))
  await cmsMutation({
    headers,
    // Editors cannot change Brand, so they never touch the settings media usage.
    ...(isAdmin
      ? { media: { owner: { entity: 'settings', id: 'site', label: 'Pengaturan situs' }, refs } }
      : {}),
    run: async (tx, actor) => {
      if ((actor.role === 'admin') !== isAdmin)
        throw new CmsError('CONFLICT', 'Peran Anda berubah. Muat ulang halaman.')
      // Re-validate against the locked rows so a concurrent Admin change is not overwritten by
      // the Admin-only groups an Editor carried over.
      const next = parse(await readStoredSettings(tx, routing.locales, true))
      await persist(tx, actor, next)
    },
  })
  revalidateChange({ entity: 'settings' })
}

async function persist(
  tx: DatabaseTransaction,
  actor: Principal,
  next: {
    previousGlobal: SettingsGlobal
    global: SettingsGlobal
    locales: Record<string, { before: SettingsLocale; after: SettingsLocale }>
    seeded: boolean
  },
) {
  const now = new Date()
  const globalChanges = next.seeded
    ? changedKeys(next.previousGlobal, next.global)
    : Object.keys(next.global)
  if (globalChanges.length || !next.seeded) {
    await tx
      .insert(siteSettings)
      .values({ id: 'site', data: next.global, updatedBy: actor.id, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { data: next.global, updatedBy: actor.id, updatedAt: now },
      })
    await writeAudit(tx, actor, {
      entity: 'settings',
      entityId: 'site',
      action: next.seeded ? 'update' : 'create',
      changedFields: globalChanges,
    })
  }
  for (const [locale, { before, after }] of Object.entries(next.locales)) {
    const [existing] = await tx
      .select({ locale: siteSettingsTranslation.locale })
      .from(siteSettingsTranslation)
      .where(eq(siteSettingsTranslation.locale, locale))
    const changes = existing ? changedKeys(before, after) : Object.keys(after)
    if (!changes.length) continue
    await tx
      .insert(siteSettingsTranslation)
      .values({ locale, data: after, updatedBy: actor.id, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettingsTranslation.locale,
        set: { data: after, updatedBy: actor.id, updatedAt: now },
      })
    await writeAudit(tx, actor, {
      entity: 'settings',
      entityId: `site:${locale}`,
      action: existing ? 'update' : 'create',
      changedFields: changes.map((key) => LOCALE_AUDIT[key] ?? 'seo'),
    })
  }
}

function prefixed(errors: Record<string, string>, prefix: string) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [`${prefix}${key}`, value]),
  )
}

/** Title template, site name and origin for the admin SEO snippet preview. */
export async function seoPreviewSettings() {
  const fallback = defaultSettings()
  // The preview is a convenience: an unreachable or unmigrated table falls back to launch values.
  const stored = await readStoredSettings(db, [routing.defaultLocale]).catch(() => ({
    global: null,
    locales: {} as Record<string, SettingsLocale>,
  }))
  return {
    titleTemplate: (stored.locales[routing.defaultLocale] ?? fallback.local).seo.titleTemplate,
    siteName: (stored.global ?? fallback.global).brand.siteName,
    origin: process.env.SITE_URL ?? 'http://127.0.0.1:3000',
  }
}
