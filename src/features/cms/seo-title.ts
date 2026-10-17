/**
 * The site applies the SEO title template to every page (CPR-104), so stored meta titles hold the
 * topic only. The static launch content keeps the full "... | Sineva" text (it is shared with the
 * static deployment on main), so the seed strips the suffix on the way into the database, matching
 * migration 0019. Only an exact trailing " | Sineva" is removed.
 */
const BRAND_SUFFIX = / \| Sineva$/

export function topicTitle(metaTitle: string): string {
  return metaTitle.replace(BRAND_SUFFIX, '')
}

export function withTopicTitle<T extends { metaTitle: string }>(seo: T): T
export function withTopicTitle<T extends { metaTitle: string }>(seo: T | undefined): T | undefined
export function withTopicTitle<T extends { metaTitle: string }>(seo: T | undefined) {
  return seo ? { ...seo, metaTitle: topicTitle(seo.metaTitle) } : seo
}
