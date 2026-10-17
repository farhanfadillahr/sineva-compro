import { staticContentFor } from '../../content/static/source'
import type { ContentLocale, PageKey } from '../content/types'
import { storedFromDto } from '../cms/fields'
import { withTopicTitle } from '../cms/seo-title'
import { pageSchemas } from './fields'

export type StoredPage = Record<string, unknown>

/**
 * Stored form of a page's static launch content, or `null` for a locale without launch copy (no
 * cross-locale fallback). Pure, so the seed script and tests can use it.
 */
export function launchPage(key: PageKey, locale: ContentLocale): StoredPage | null {
  const bundle = staticContentFor(locale)
  if (!bundle) return null
  const {
    key: _key,
    locale: _locale,
    ...data
  } = bundle.pages[key] as unknown as Record<string, unknown>
  void _key
  void _locale
  const seo = withTopicTitle(data.seo as { metaTitle: string } | undefined)
  return storedFromDto(pageSchemas[key], seo ? { ...data, seo } : data) as StoredPage
}
