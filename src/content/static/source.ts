import type { PublicContentSource } from '../../features/content/public'
import type { ContentLocale, PageContentMap, PageKey } from '../../features/content/types'
import { capabilities, industries } from './capabilities'
import { team, work, workDetails } from './empty'
import { faq } from './faq'
import { staticContentId } from './id'
import { pages } from './pages'
import { categories, postDetails, posts } from './posts'
import { serviceDetails, services } from './services'
import { siteSettings } from './site-settings'

/** Everything the static launch publishes, per locale. Exported so tests can inspect the data. */
export const staticContent = {
  siteSettings,
  pages,
  services,
  serviceDetails,
  capabilities,
  industries,
  faq,
  work,
  workDetails,
  posts,
  postDetails,
  categories,
  team,
} as const

export { staticContentId }

type Bundle = typeof staticContent

// One bundle per enabled locale. A locale missing here gets the empty contract ([] and null),
// exactly what the database source returns for a locale with no published rows.
const bundles: Partial<Record<ContentLocale, Bundle>> = { en: staticContent, id: staticContentId }

/** The launch content of a locale, or `null` when it has none. For seeds and tests. */
export function staticContentFor(locale: ContentLocale): Bundle | null {
  return bundles[locale] ?? null
}

/** Callers get copies, so one caller mutating a result cannot change what the next one sees. */
const copy = <T>(value: T): T => structuredClone(value)

const findBySlug = <T extends { slug: string }>(items: readonly T[], slug: string): T | null =>
  items.find((item) => item.slug === slug) ?? null

/**
 * `PublicContentSource` backed by typed modules in the repo. It is the launch content source: the
 * landing pages read the same contract the CMS will implement, so switching to the database
 * source later is a one-line change in `src/lib/content-source.ts`.
 *
 * Behaviour mirrors `createFixtureContentSource` on purpose (same copies, same RangeError on bad
 * paging, same empty contract for a locale without content), so pages tested against fixtures
 * behave the same here. It is kept separate rather than shared because the fixture source reads
 * from `tests/` and production code must not import that.
 */
export function createStaticContentSource(): PublicContentSource {
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
      // The database source paginates in SQL, so bad input must fail loudly here too instead of
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
