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
  const { items, translations } = collectionRegistry[name].tables
  for (const row of rows) {
    const [existing] = await tx.select().from(items).where(eq(items.key, row.key)).for('update')
    if (existing) {
      // Never adopt a real row that happens to use a demo key, and never touch an edited row.
      if (isDemo && !existing.isDemo)
        throw new Error(`Reserved demo key ${row.key} belongs to real data`)
      continue
    }
    const [{ last }] = await tx.select({ last: max(items.sortOrder) }).from(items)
    const [created] = await tx
      .insert(items)
      .values({ key: row.key, sortOrder: (last ?? -1) + 1, data: row.global, isDemo })
      .returning({ id: items.id })
    // Launch copy exists for the default locale only; other locales are written by editors.
    await tx
      .insert(translations)
      .values({ itemId: created.id, locale: routing.defaultLocale, data: row.local })
  }
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
