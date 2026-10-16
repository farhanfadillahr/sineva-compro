/**
 * Which public cache tags a committed content change must refresh (CPR-33). Pure, so the mapping
 * is unit tested; `revalidateChange` applies it after the transaction has committed. A failed
 * transaction throws before reaching it, so nothing is refreshed as if it had succeeded.
 *
 * Rules:
 * - Every locale is refreshed, not only the edited one: language switchers and alternates on the
 *   other locale's pages point at the changed page.
 * - A slug change refreshes the old and the new item tag.
 * - Lists, Home (through the shared tags it reads) and the sitemap follow the entity they show.
 * - Drafts and previews never call this: they are never cached.
 */
import { routing } from '../../i18n/routing'
import { cacheTags } from '../../lib/cache/tags'
import type { ContentLocale, PageKey } from '../content/types'

export type ContentChange =
  | Readonly<{ entity: 'settings' }>
  | Readonly<{ entity: 'page'; key: PageKey }>
  | Readonly<{ entity: 'service' | 'post' | 'work'; slugs: readonly (string | null | undefined)[] }>
  | Readonly<{ entity: 'capabilities' | 'industries' | 'faq' | 'team' | 'categories' }>

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const validSlugs = (slugs: readonly (string | null | undefined)[]) =>
  [...new Set(slugs)].filter((slug): slug is string => !!slug && SLUG.test(slug))

function forLocale(change: ContentChange, locale: ContentLocale): string[] {
  switch (change.entity) {
    case 'settings':
      // Every page renders settings through the layout; the sitemap honours the index switch.
      return [cacheTags.settings, cacheTags.sitemap]
    case 'page':
      return [cacheTags.page(change.key, locale), cacheTags.sitemap]
    case 'service':
      return [
        cacheTags.services(locale),
        ...validSlugs(change.slugs).map((slug) => cacheTags.service(slug, locale)),
        cacheTags.sitemap,
      ]
    case 'post':
      return [
        cacheTags.posts(locale),
        ...validSlugs(change.slugs).map((slug) => cacheTags.post(slug, locale)),
        cacheTags.sitemap,
      ]
    case 'work':
      return [
        cacheTags.work(locale),
        ...validSlugs(change.slugs).map((slug) => cacheTags.workItem(slug, locale)),
        cacheTags.sitemap,
      ]
    case 'capabilities':
      return [cacheTags.capabilities(locale)]
    case 'industries':
      return [cacheTags.industries(locale)]
    case 'faq':
      return [cacheTags.faq(locale)]
    case 'team':
      // Bylines on articles show team names and photos.
      return [cacheTags.team(locale), cacheTags.posts(locale)]
    case 'categories':
      return [cacheTags.categories(locale), cacheTags.posts(locale)]
  }
}

export function invalidationTags(
  change: ContentChange,
  locales: readonly ContentLocale[] = routing.locales,
): string[] {
  return [...new Set(locales.flatMap((locale) => forLocale(change, locale)))]
}
