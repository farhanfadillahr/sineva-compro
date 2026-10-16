import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type { ContentLocale, PageContentMap, PageKey } from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { parseFields } from '../cms/fields'
import { resolveMediaFields } from '../cms/media.server'
import { pageSchemas } from './fields'
import { readPage } from './service.server'

/**
 * Published page content for one locale. The stored document is migrated to the current version
 * and validated again on read: a row that no longer fits the code is not served half-broken.
 */
async function getPage<K extends PageKey>(
  key: K,
  locale: ContentLocale,
): Promise<PageContentMap[K] | null> {
  const row = await readPage(db, key, locale)
  if (!row) return null
  const parsed = parseFields(pageSchemas[key], row.data)
  if (!parsed.ok) {
    console.error(`Page content ${key}:${locale} does not match its schema.`)
    return null
  }
  const resolved = (await resolveMediaFields(db, pageSchemas[key], parsed.value, locale)) as object
  return { key, locale, ...resolved } as unknown as PageContentMap[K]
}

export const pageReads = {
  getPage: cachedRead('page', getPage, (key, locale) => [cacheTags.page(key, locale)]) as <
    K extends PageKey,
  >(
    key: K,
    locale: ContentLocale,
  ) => Promise<PageContentMap[K] | null>,
} satisfies Partial<PublicContentSource>
