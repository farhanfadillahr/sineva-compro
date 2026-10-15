import type { ContentLocale, PageKey } from '../../features/content/types'

/**
 * The single file of cache tag names. Public reads tag their cached results with these, and
 * invalidation (revalidateTag) uses the same builders, so the two sides can never drift.
 *
 * Shape is `<entity>[:<slug>]:<locale>`. List and item tags use different entity prefixes
 * (`work:` and `work-item:`) so a list tag can never equal an item tag. `settings` and
 * `sitemap` are global because they are not scoped to one locale.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A slug containing `:` or uppercase would make tags ambiguous or non-deterministic. */
function slugPart(slug: string): string {
  if (!SLUG.test(slug)) throw new RangeError(`Invalid slug for cache tag: ${JSON.stringify(slug)}`)
  return slug
}

export const cacheTags = {
  settings: 'settings',
  sitemap: 'sitemap',
  page: (key: PageKey, locale: ContentLocale) => `page:${key}:${locale}`,
  services: (locale: ContentLocale) => `services:${locale}`,
  service: (slug: string, locale: ContentLocale) => `service:${slugPart(slug)}:${locale}`,
  capabilities: (locale: ContentLocale) => `capabilities:${locale}`,
  industries: (locale: ContentLocale) => `industries:${locale}`,
  faq: (locale: ContentLocale) => `faq:${locale}`,
  work: (locale: ContentLocale) => `work:${locale}`,
  workItem: (slug: string, locale: ContentLocale) => `work-item:${slugPart(slug)}:${locale}`,
  posts: (locale: ContentLocale) => `posts:${locale}`,
  post: (slug: string, locale: ContentLocale) => `post:${slugPart(slug)}:${locale}`,
  categories: (locale: ContentLocale) => `categories:${locale}`,
  team: (locale: ContentLocale) => `team:${locale}`,
} as const
