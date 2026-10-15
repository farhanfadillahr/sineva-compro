/**
 * The public read contract. The CMS implements it against PostgreSQL (`public.server.ts` per
 * entity, tagged with `src/lib/cache/tags.ts`); landing pages consume it and are tested against
 * `createFixtureContentSource()` in `fixture-source.ts` until the DB source exists.
 *
 * Deliberately free of `server-only` so the interface and its fixtures load in unit tests.
 * The DB implementation must carry `server-only` itself.
 *
 * Every function: takes an explicit locale, returns published data only, and returns a safe
 * projection. Empty is explicit: `[]` for collections, `null` for a missing single item.
 */
import type {
  Category,
  ContentLocale,
  FaqItem,
  FaqTag,
  Industry,
  PageContentMap,
  PageKey,
  PostDetail,
  PostPage,
  ProductCapability,
  ServiceDetail,
  ServiceSummary,
  SiteSettingsDTO,
  TeamMember,
  WorkDetail,
  WorkSummary,
} from './types'

export type ListWorkInput = Readonly<{
  locale: ContentLocale
  /** Only work related to this service slug. */
  service?: string
  /** Only featured work, for the Home "Selected work" section. */
  featured?: boolean
}>

export type ListPostsInput = Readonly<{
  locale: ContentLocale
  /** Category slug. */
  category?: string
  /** 1-based. */
  page: number
  pageSize: number
}>

export interface PublicContentSource {
  /** `null` when settings have not been created for the locale. */
  getSiteSettings(locale: ContentLocale): Promise<SiteSettingsDTO | null>
  getPage<K extends PageKey>(key: K, locale: ContentLocale): Promise<PageContentMap[K] | null>

  listServices(locale: ContentLocale): Promise<readonly ServiceSummary[]>
  getService(slug: string, locale: ContentLocale): Promise<ServiceDetail | null>

  listCapabilities(locale: ContentLocale): Promise<readonly ProductCapability[]>
  listIndustries(locale: ContentLocale): Promise<readonly Industry[]>
  listFaq(tag: FaqTag, locale: ContentLocale): Promise<readonly FaqItem[]>

  listWork(input: ListWorkInput): Promise<readonly WorkSummary[]>
  getWork(slug: string, locale: ContentLocale): Promise<WorkDetail | null>

  /** Newest first. Rejects with RangeError when `page` or `pageSize` is not a positive integer. */
  listPosts(input: ListPostsInput): Promise<PostPage>
  getPost(slug: string, locale: ContentLocale): Promise<PostDetail | null>
  listCategories(locale: ContentLocale): Promise<readonly Category[]>

  /** Members shown on About, in display order. */
  listTeam(locale: ContentLocale): Promise<readonly TeamMember[]>
}
