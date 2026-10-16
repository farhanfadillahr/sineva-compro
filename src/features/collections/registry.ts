import { cacheTags } from '../../lib/cache/tags'
import type { ContentLocale } from '../content/types'
import { collectionConfigs, type CollectionName } from './configs'
import { businessTypeTables, productCapabilityTables, type CollectionTables } from './tables'

/** Tables and public cache tags of each ordered collection. */
export const collectionRegistry: Record<
  CollectionName,
  { tables: CollectionTables; tags: (locale: ContentLocale) => string[] }
> = {
  capabilities: { tables: productCapabilityTables, tags: (l) => [cacheTags.capabilities(l)] },
  businessTypes: { tables: businessTypeTables, tags: (l) => [cacheTags.industries(l)] },
}

export function isCollectionName(value: unknown): value is CollectionName {
  return typeof value === 'string' && Object.hasOwn(collectionConfigs, value)
}
