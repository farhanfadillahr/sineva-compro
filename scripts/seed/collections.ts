import { and, eq, max } from 'drizzle-orm'
import type { DatabaseTransaction } from '../../src/lib/db/connection'
import { routing } from '../../src/i18n/routing'
import type { CollectionName } from '../../src/features/collections/configs'
import { collectionRegistry } from '../../src/features/collections/registry'
import { collectionSeedData, type SeedRow } from '../../src/features/collections/seed-data'
import type { SeedModule } from './types'

async function insertMissing(
  tx: DatabaseTransaction,
  name: CollectionName,
  rows: readonly SeedRow[],
  isDemo: boolean,
) {
  const { items } = collectionRegistry[name].tables
  for (const row of rows) {
    const [existing] = await tx.select().from(items).where(eq(items.key, row.key)).for('update')
    if (existing) {
      // Never adopt a real row that happens to use a demo key, and never touch an edited row.
      if (isDemo && !existing.isDemo)
        throw new Error(`Reserved demo key ${row.key} belongs to real data`)
      // A locale enabled after the first seed (CPR-101) gets its launch copy; an existing
      // translation is never replaced.
      if (!existing.isDemo) await addTranslations(tx, name, existing.id, row, false)
      continue
    }
    const [{ last }] = await tx.select({ last: max(items.sortOrder) }).from(items)
    const [created] = await tx
      .insert(items)
      .values({ key: row.key, sortOrder: (last ?? -1) + 1, data: row.global, isDemo })
      .returning({ id: items.id })
    await addTranslations(tx, name, created.id, row, true)
  }
}

async function addTranslations(
  tx: DatabaseTransaction,
  name: CollectionName,
  itemId: string,
  row: SeedRow,
  includeDefault: boolean,
) {
  const { translations } = collectionRegistry[name].tables
  const byLocale: Record<string, object> = {
    ...(includeDefault ? { [routing.defaultLocale]: row.local } : {}),
    ...row.translations,
  }
  for (const [locale, data] of Object.entries(byLocale))
    await tx.insert(translations).values({ itemId, locale, data }).onConflictDoNothing()
}

/** Base: the launch rows, inserted only when their key is missing. Demo rows are flagged. */
export function collectionSeed(name: CollectionName, key: string): SeedModule {
  return {
    key,
    async base(tx) {
      await insertMissing(tx, name, collectionSeedData[name].launch(), false)
    },
    async demo(tx) {
      await insertMissing(tx, name, collectionSeedData[name].demo, true)
    },
    async purgeDemo(tx) {
      const { items } = collectionRegistry[name].tables
      for (const row of collectionSeedData[name].demo)
        await tx.delete(items).where(and(eq(items.key, row.key), eq(items.isDemo, true)))
    },
  }
}
