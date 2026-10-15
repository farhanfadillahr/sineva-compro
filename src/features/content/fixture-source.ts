/**
 * Fixture-backed implementation of the public contract, for landing development and component
 * tests until the CMS tickets ship the database source. It lives next to, not inside, `public.ts`
 * so that importing the interface never pulls test fixtures into a bundle. Do not import this
 * from production routes once the DB source exists.
 */
import { publicFixtures } from '../../../tests/fixtures/public'
import type { PublicContentSource } from './public'
import type { ContentLocale, PageContentMap, PageKey } from './types'

type Bundle = typeof publicFixtures

// Only `en` has fixtures. Any other enabled locale gets the empty contract ([] and null), which
// is exactly how the DB source behaves for a locale with no published rows.
const bundles: Partial<Record<ContentLocale, Bundle>> = { en: publicFixtures }

/** Callers get copies so one test mutating a result cannot change what the next one sees. */
const copy = <T>(value: T): T => structuredClone(value)

const findBySlug = <T extends { slug: string }>(items: readonly T[], slug: string): T | null =>
  items.find((item) => item.slug === slug) ?? null

export function createFixtureContentSource(): PublicContentSource {
  return {
    async getSiteSettings(locale) {
      const bundle = bundles[locale]
      return bundle ? copy(bundle.siteSettings) : null
    },

    async getPage<K extends PageKey>(key: K, locale: ContentLocale) {
      const bundle = bundles[locale]
      return bundle ? copy(bundle.pages[key] as PageContentMap[K]) : null
    },

    async listServices(locale) {
      return copy(bundles[locale]?.services ?? [])
    },
    async getService(slug, locale) {
      const found = findBySlug(bundles[locale]?.serviceDetails ?? [], slug)
      return found ? copy(found) : null
    },

    async listCapabilities(locale) {
      return copy(bundles[locale]?.capabilities ?? [])
    },
    async listIndustries(locale) {
      return copy(bundles[locale]?.industries ?? [])
    },
    async listFaq(tag, locale) {
      const entries = bundles[locale]?.faq ?? []
      return copy(entries.filter((entry) => entry.tags.includes(tag)).map((entry) => entry.item))
    },

    async listWork({ locale, service, featured }) {
      const items = bundles[locale]?.work ?? []
      return copy(
        items.filter(
          (item) =>
            (service === undefined || item.serviceSlug === service) &&
            (featured === undefined || item.featured === featured),
        ),
      )
    },
    async getWork(slug, locale) {
      const found = findBySlug(bundles[locale]?.workDetails ?? [], slug)
      return found ? copy(found) : null
    },

    async listPosts({ locale, category, page, pageSize }) {
      // The DB source paginates in SQL, so bad input must fail loudly here too instead of
      // silently returning an empty page that hides a caller bug.
      if (!Number.isInteger(page) || page < 1) throw new RangeError('page must be an integer >= 1')
      if (!Number.isInteger(pageSize) || pageSize < 1)
        throw new RangeError('pageSize must be an integer >= 1')
      const matching = [...(bundles[locale]?.posts ?? [])]
        .filter((post) => category === undefined || post.category?.slug === category)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      const start = (page - 1) * pageSize
      return copy({
        posts: matching.slice(start, start + pageSize),
        total: matching.length,
        page,
        pageSize,
      })
    },
    async getPost(slug, locale) {
      const found = findBySlug(bundles[locale]?.postDetails ?? [], slug)
      return found ? copy(found) : null
    },
    async listCategories(locale) {
      return copy(bundles[locale]?.categories ?? [])
    },

    async listTeam(locale) {
      return copy(bundles[locale]?.team ?? [])
    },
  }
}
