import { or, sql } from 'drizzle-orm'
import { cacheTags } from '../../lib/cache/tags'
import type { DatabaseTransaction } from '../../lib/db/connection'
import { postTranslation } from '../documents/tables'
import type { ContentLocale } from '../content/types'
import { collectionConfigs, type CollectionName } from './configs'
import {
  businessTypeTables,
  categoryTables,
  faqItemTables,
  productCapabilityTables,
  teamMemberTables,
  type CollectionTables,
} from './tables'

/** Articles whose draft or published snapshot points at `field = value`. */
async function postsUsing(tx: DatabaseTransaction, field: string, value: string) {
  const rows = await tx
    .select({ id: postTranslation.itemId })
    .from(postTranslation)
    .where(
      or(
        sql`${postTranslation.draft} ->> ${field} = ${value}`,
        sql`${postTranslation.published} ->> ${field} = ${value}`,
      ),
    )
    .limit(1)
  return rows.length > 0
}

/** Tables and public cache tags of each ordered collection. */
export const collectionRegistry: Record<
  CollectionName,
  {
    tables: CollectionTables
    tags: (locale: ContentLocale) => string[]
    /** A message when the item is still referenced and must not be deleted. */
    inUse?: (tx: DatabaseTransaction, item: { id: string; key: string }) => Promise<string | null>
  }
> = {
  capabilities: { tables: productCapabilityTables, tags: (l) => [cacheTags.capabilities(l)] },
  businessTypes: { tables: businessTypeTables, tags: (l) => [cacheTags.industries(l)] },
  faq: { tables: faqItemTables, tags: (l) => [cacheTags.faq(l)] },
  // Author names and photos appear on articles, so a team change refreshes the posts too.
  team: {
    tables: teamMemberTables,
    tags: (l) => [cacheTags.team(l), cacheTags.posts(l)],
    inUse: async (tx, item) =>
      (await postsUsing(tx, 'authorId', item.id))
        ? 'Anggota ini masih menjadi penulis artikel. Ganti penulis artikel tersebut lebih dulu.'
        : null,
  },
  // Category names appear on post cards, so a rename refreshes the posts too.
  categories: {
    tables: categoryTables,
    tags: (l) => [cacheTags.categories(l), cacheTags.posts(l)],
    inUse: async (tx, item) =>
      (await postsUsing(tx, 'categorySlug', item.key))
        ? 'Kategori masih dipakai artikel. Pindahkan artikel tersebut lebih dulu.'
        : null,
  },
}

export function isCollectionName(value: unknown): value is CollectionName {
  return typeof value === 'string' && Object.hasOwn(collectionConfigs, value)
}
