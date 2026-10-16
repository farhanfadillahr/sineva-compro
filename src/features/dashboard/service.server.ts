import 'server-only'
import { and, count, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { auditLog } from '../audit/schema'
import { user } from '../auth/schema'
import type { Principal } from '../auth/types'
import { cmsReader } from '../cms/mutation.server'
import { collectionConfigs, type CollectionName } from '../collections/configs'
import { collectionRegistry } from '../collections/registry'
import { documentConfigs, type DocumentName } from '../documents/configs'
import { documentRegistry } from '../documents/registry.server'
import { lead } from '../leads/schema'
import { pageContent } from '../pages/schema'
import { PAGE_KEYS } from '../content/types'
import { service, serviceTranslation } from '../services/schema'
import { waitlist } from '../waitlist/schema'

/** Days are Asia/Jakarta calendar days; timestamps stay UTC in the database. */
const TZ = 'Asia/Jakarta'
// A literal, not a bind parameter: SELECT and GROUP BY must be the identical expression.
const TZ_SQL = sql.raw(`'${TZ}'`)
export const RANGES = [7, 30, 90] as const
export type RangeDays = (typeof RANGES)[number]

export function readRange(value: string | string[] | undefined): RangeDays {
  const days = Number(typeof value === 'string' ? value : 30)
  return (RANGES as readonly number[]).includes(days) ? (days as RangeDays) : 30
}

/** Start of the Jakarta day `daysAgo` days before today, as a UTC instant. */
function jakartaDayStart(daysAgo: number, now = new Date()) {
  const jakarta = new Date(now.getTime() + 7 * 3_600_000)
  const midnight = Date.UTC(jakarta.getUTCFullYear(), jakarta.getUTCMonth(), jakarta.getUTCDate())
  return new Date(midnight - daysAgo * 86_400_000 - 7 * 3_600_000)
}

const CONTENT_ENTITIES = [
  'pages',
  'services',
  'posts',
  'portfolio',
  'faq',
  'product',
  'team',
  'categories',
  'media',
] as const

async function leadStats(days: RangeDays) {
  const start = jakartaDayStart(days - 1)
  const previousStart = jakartaDayStart(days * 2 - 1)
  const day = sql<string>`to_char(${lead.createdAt} AT TIME ZONE ${TZ_SQL}, 'YYYY-MM-DD')`
  const [
    current,
    previous,
    perDay,
    perService,
    perSegment,
    perStatus,
    latest,
    waitCurrent,
    waitPrevious,
    waitPerDay,
  ] = await Promise.all([
    db.select({ n: count() }).from(lead).where(gte(lead.createdAt, start)),
    db
      .select({ n: count() })
      .from(lead)
      .where(and(gte(lead.createdAt, previousStart), lt(lead.createdAt, start))),
    db
      .select({ day, n: count() })
      .from(lead)
      .where(gte(lead.createdAt, previousStart))
      .groupBy(day),
    db
      .select({ key: lead.interest, n: count() })
      .from(lead)
      .where(gte(lead.createdAt, start))
      .groupBy(lead.interest),
    db
      .select({ key: lead.segment, n: count() })
      .from(lead)
      .where(gte(lead.createdAt, start))
      .groupBy(lead.segment),
    db
      .select({ key: lead.status, n: count() })
      .from(lead)
      .where(gte(lead.createdAt, start))
      .groupBy(lead.status),
    db
      .select({ id: lead.id, name: lead.name, interest: lead.interest, createdAt: lead.createdAt })
      .from(lead)
      .orderBy(desc(lead.createdAt))
      .limit(5),
    db.select({ n: count() }).from(waitlist).where(gte(waitlist.createdAt, start)),
    db
      .select({ n: count() })
      .from(waitlist)
      .where(and(gte(waitlist.createdAt, previousStart), lt(waitlist.createdAt, start))),
    db
      .select({
        day: sql<string>`to_char(${waitlist.createdAt} AT TIME ZONE ${TZ_SQL}, 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(waitlist)
      .where(gte(waitlist.createdAt, start))
      .groupBy(sql`1`),
  ])
  const counts = new Map(perDay.map((r) => [r.day, r.n]))
  const series = Array.from({ length: days }, (_, index) => {
    const date = jakartaDayStart(days - 1 - index)
    const key = new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)
    const previousKey = new Date(date.getTime() - days * 86_400_000 + 7 * 3_600_000)
      .toISOString()
      .slice(0, 10)
    return { day: key, leads: counts.get(key) ?? 0, previous: counts.get(previousKey) ?? 0 }
  })
  const waitCounts = new Map(waitPerDay.map((r) => [r.day, r.n]))
  return {
    leads: { value: current[0].n, previous: previous[0].n, sparkline: series.map((s) => s.leads) },
    waitlist: {
      value: waitCurrent[0].n,
      previous: waitPrevious[0].n,
      sparkline: series.map((s) => waitCounts.get(s.day) ?? 0),
    },
    series,
    perService: perService
      .map((r) => ({ label: r.key, value: r.n }))
      .sort((a, b) => b.value - a.value),
    perSegment: perSegment
      .map((r) => ({ label: r.key, value: r.n }))
      .sort((a, b) => b.value - a.value),
    perStatus: perStatus.map((r) => ({ status: r.key, value: r.n })),
    latest: latest.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  }
}

/** Posts and work whose saved draft differs from what is published (or is not published yet). */
async function draftsWaiting() {
  const result: { id: string; title: string; href: string; kind: string; updatedAt: string }[] = []
  for (const name of Object.keys(documentConfigs) as DocumentName[]) {
    const { translations } = documentRegistry[name].tables
    const rows = await db
      .select({
        id: translations.itemId,
        draft: translations.draft,
        published: translations.published,
        draftSlug: translations.draftSlug,
        publishedSlug: translations.publishedSlug,
        updatedAt: translations.draftUpdatedAt,
      })
      .from(translations)
      .where(
        or(
          isNull(translations.published),
          ne(translations.draftSlug, sql`coalesce(${translations.publishedSlug}, '')`),
          sql`${translations.draft} <> ${translations.published}`,
        ),
      )
      .orderBy(desc(translations.draftUpdatedAt))
      .limit(20)
    for (const row of rows)
      result.push({
        id: `${name}:${row.id}`,
        title: String((row.draft as { title?: string }).title || 'Tanpa judul'),
        href: `${documentConfigs[name].adminPath}/${row.id}`,
        kind: documentConfigs[name].itemLabel,
        updatedAt: row.updatedAt.toISOString(),
      })
  }
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Content that exists in the default locale but not in another enabled locale. */
async function missingTranslations() {
  const others: string[] = (routing.locales as readonly string[]).filter(
    (l) => l !== routing.defaultLocale,
  )
  if (!others.length) return { count: 0, items: [] as { label: string; href: string }[] }
  const items: { label: string; href: string }[] = []
  const pages = await db
    .select({ key: pageContent.pageKey, locale: pageContent.locale })
    .from(pageContent)
  for (const key of PAGE_KEYS)
    for (const locale of others)
      if (!pages.some((p) => p.key === key && p.locale === locale))
        items.push({ label: `Halaman ${key} (${locale.toUpperCase()})`, href: '/admin/pages' })
  const services = await db.select({ id: service.id }).from(service)
  const serviceLocales = await db
    .select({ id: serviceTranslation.serviceId, locale: serviceTranslation.locale })
    .from(serviceTranslation)
  for (const s of services)
    for (const locale of others)
      if (!serviceLocales.some((t) => t.id === s.id && t.locale === locale))
        items.push({ label: `Layanan (${locale.toUpperCase()})`, href: `/admin/services/${s.id}` })
  for (const name of Object.keys(collectionConfigs) as CollectionName[]) {
    const { items: table, translations } = collectionRegistry[name].tables
    const rows = await db.select({ id: table.id }).from(table)
    const localized = rows.length
      ? await db
          .select({ id: translations.itemId, locale: translations.locale })
          .from(translations)
          .where(
            inArray(
              translations.itemId,
              rows.map((r) => r.id),
            ),
          )
      : []
    for (const row of rows)
      for (const locale of others)
        if (!localized.some((t) => t.id === row.id && t.locale === locale))
          items.push({
            label: `${collectionConfigs[name].itemLabel} (${locale.toUpperCase()})`,
            href: collectionConfigs[name].adminPath,
          })
  }
  return { count: items.length, items: items.slice(0, 20) }
}

async function activity(principal: Principal) {
  const rows = await db
    .select({
      id: auditLog.id,
      actor: user.name,
      entity: auditLog.entity,
      action: auditLog.action,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorId))
    // Editors see content activity only, never users, settings, email, leads or waitlist.
    .where(principal.role === 'admin' ? undefined : inArray(auditLog.entity, [...CONTENT_ENTITIES]))
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(10)
  return rows.map((r) => ({
    id: r.id,
    actor: r.actor ?? 'Sistem',
    entity: r.entity,
    action: r.action,
    date: r.createdAt.toISOString(),
  }))
}

/**
 * Everything the dashboard shows. Lead and waitlist numbers are computed only for Admins: for an
 * Editor those queries never run and the fields are `null`.
 */
export async function loadDashboard(headers: Headers, days: RangeDays) {
  const principal = await cmsReader(headers)
  const isAdmin = principal.role === 'admin'
  const [leads, drafts, missing, feed] = await Promise.all([
    isAdmin ? leadStats(days) : Promise.resolve(null),
    draftsWaiting(),
    missingTranslations(),
    activity(principal),
  ])
  return { principal, days, leads, drafts, missing, feed }
}
