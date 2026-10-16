import { and, eq, inArray } from 'drizzle-orm'
import { routing } from '../../src/i18n/routing'
import { portfolioTables } from '../../src/features/documents/tables'
import { demoWork, launchWork } from '../../src/features/work/launch'
import type { SeedModule } from './types'

const { items, translations } = portfolioTables
type Tx = Parameters<SeedModule['base']>[0]

async function bySlug(tx: Tx, slug: string) {
  const [row] = await tx
    .select({ id: items.id, isDemo: items.isDemo })
    .from(translations)
    .innerJoin(items, eq(items.id, translations.itemId))
    .where(and(eq(translations.locale, routing.defaultLocale), eq(translations.draftSlug, slug)))
  return row
}

async function insertPublished(tx: Tx, row: { slug: string; data: object }, isDemo: boolean) {
  const [created] = await tx.insert(items).values({ isDemo }).returning({ id: items.id })
  const now = new Date()
  await tx.insert(translations).values({
    itemId: created.id,
    locale: routing.defaultLocale,
    draftSlug: row.slug,
    draft: row.data,
    publishedSlug: row.slug,
    published: row.data,
    firstPublishedAt: now,
    lastPublishedAt: now,
  })
}

/** Base: launch work (none yet). Demo: three flagged internal demo projects; purge removes them. */
export const workSeed: SeedModule = {
  key: 'work',
  async base(tx) {
    for (const row of launchWork())
      if (!(await bySlug(tx, row.slug))) await insertPublished(tx, row, false)
  },
  async demo(tx) {
    for (const row of demoWork) {
      const existing = await bySlug(tx, row.slug)
      if (existing && !existing.isDemo) throw new Error('Reserved demo slug belongs to real work')
      if (!existing) await insertPublished(tx, row, true)
    }
  },
  async purgeDemo(tx) {
    const ids = []
    for (const row of demoWork) {
      const existing = await bySlug(tx, row.slug)
      if (existing?.isDemo) ids.push(existing.id)
    }
    if (ids.length)
      await tx.delete(items).where(and(inArray(items.id, ids), eq(items.isDemo, true)))
  },
}
