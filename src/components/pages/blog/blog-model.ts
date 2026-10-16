import { extractHeadings, type TocHeading } from '@/components/content/rich-text-model'
import type { PublicContentSource } from '@/features/content/public'
import type {
  BlogIndexPageContent,
  Category,
  ContentLocale,
  PostDetail,
  PostSummary,
  SiteSettingsDTO,
} from '@/features/content/types'
import {
  BLOG_LIST_PATH,
  BLOG_PAGE_SIZE,
  paginate,
  parseBlogQuery,
  type BlogQuery,
  type RawSearchParams,
} from './blog-query'
import { estimateReadingMinutes } from './reading-time'

export const BLOG_HREFS = {
  home: '/',
  contact: '/contact',
  blog: BLOG_LIST_PATH,
} as const

/** Encoded: the slug comes from content, and a `/` or `?` in it must not change the route. */
export const blogPostHref = (slug: string) => `${BLOG_LIST_PATH}/${encodeURIComponent(slug)}`

/** Related articles shown under an article. */
export const BLOG_RELATED_LIMIT = 3

/**
 * Ids the article page uses itself. Body headings avoid them, so a heading called "Final CTA"
 * cannot take the id the sticky bar and the table of contents rely on.
 */
export const BLOG_RESERVED_IDS = [
  'main-content',
  'final-cta',
  'article-toc',
  'article-share',
  'related-posts',
] as const

/**
 * How many articles the list reads at once. The content contract pages by `page` and `pageSize`
 * only, and the grid has to leave the featured article out of its own pages, which no page size
 * can express. The list therefore reads the locale's articles in one go and paginates them here.
 * Fine for the launch volume; at this limit the list would silently drop older articles, so the
 * database source should get an offset-aware query before the blog grows past it.
 */
export const BLOG_FETCH_LIMIT = 500

// ---------------------------------------------------------------------------------------------
// List /blog
// ---------------------------------------------------------------------------------------------

export type BlogListModel = Readonly<{
  locale: ContentLocale
  page: BlogIndexPageContent
  /** `null` when settings do not exist for the locale: no WhatsApp link. */
  settings: SiteSettingsDTO | null
  categories: readonly Category[]
  /** The category being shown, `null` for the unfiltered list. */
  activeCategory: string | null
  /** The query as it was understood: unknown category dropped, page clamped to a real page. */
  query: BlogQuery
  /** The latest article, on page 1 of the unfiltered list only. */
  featured: PostSummary | null
  /** The grid of this page: the featured article is not repeated in it. */
  posts: readonly PostSummary[]
  pagination: Readonly<{ page: number; totalPages: number; total: number }>
  /** No article at all in this view (not even the featured one): the page shows the empty state. */
  isEmpty: boolean
}>

/**
 * Everything the Blog list renders, through the public content contract only. Resolves to `null`
 * when the page has no content for the locale (the page then answers 404).
 *
 * Only articles of the page locale are listed. The source is asked for that locale, and the rule
 * is applied again here because it is part of the page contract (FR-I18N-05): a row of another
 * locale that slips through a query must never become the featured article or a card.
 */
export async function loadBlogListModel(
  source: PublicContentSource,
  locale: ContentLocale,
  rawQuery: RawSearchParams,
): Promise<BlogListModel | null> {
  const [page, settings, categories] = await Promise.all([
    source.getPage('blogIndex', locale),
    source.getSiteSettings(locale),
    source.listCategories(locale),
  ])
  if (!page) return null

  const requested = parseBlogQuery(
    rawQuery,
    categories.map((category) => category.slug),
  )
  const result = await source.listPosts({
    locale,
    category: requested.category ?? undefined,
    page: 1,
    pageSize: BLOG_FETCH_LIMIT,
  })
  const posts = result.posts.filter(
    (post) =>
      post.locale === locale &&
      (requested.category === null || post.category?.slug === requested.category),
  )

  // The featured article belongs to the unfiltered list only, and the grid below it must not
  // repeat it, so the grid paginates what is left.
  const hasFeatured = requested.category === null && posts.length > 0
  const gridSource = hasFeatured ? posts.slice(1) : posts
  const grid = paginate(gridSource, requested.page, BLOG_PAGE_SIZE)

  return {
    locale,
    page,
    settings,
    categories,
    activeCategory: requested.category,
    query: { category: requested.category, page: grid.page },
    featured: hasFeatured && grid.page === 1 ? posts[0]! : null,
    posts: grid.items,
    pagination: { page: grid.page, totalPages: grid.totalPages, total: grid.total },
    isEmpty: posts.length === 0,
  }
}

// ---------------------------------------------------------------------------------------------
// Article /blog/[slug]
// ---------------------------------------------------------------------------------------------

/**
 * Up to `limit` articles to read next: the same category first (newest first), then the latest
 * articles, never the article itself and never one twice. With few categories and few articles
 * the fill keeps the section useful instead of empty.
 */
export function selectRelatedPosts(
  current: Pick<PostSummary, 'slug' | 'category'>,
  sameCategory: readonly PostSummary[],
  latest: readonly PostSummary[],
  limit: number = BLOG_RELATED_LIMIT,
): PostSummary[] {
  const related: PostSummary[] = []
  const taken = new Set<string>([current.slug])
  const take = (post: PostSummary) => {
    if (related.length >= limit || taken.has(post.slug)) return
    taken.add(post.slug)
    related.push(post)
  }
  if (current.category) {
    // The caller's list is trusted for order only; membership is checked again.
    sameCategory.filter((post) => post.category?.slug === current.category?.slug).forEach(take)
  }
  latest.forEach(take)
  return related
}

export type BlogPostModel = Readonly<{
  locale: ContentLocale
  post: PostDetail
  settings: SiteSettingsDTO | null
  related: readonly PostSummary[]
  /** From the body, not the stored number, so an edited article is never out of date. */
  readingMinutes: number
  /** h2 and h3 of the body, with the ids the renderer puts on the headings. */
  headings: readonly TocHeading[]
}>

/** `null` for an unknown slug, or an article that is not published in this locale. */
export async function loadBlogPostModel(
  source: PublicContentSource,
  slug: string,
  locale: ContentLocale,
): Promise<BlogPostModel | null> {
  const post = await source.getPost(slug, locale)
  if (!post || post.locale !== locale) return null

  // One more than the limit: the article itself may be among the results.
  const size = BLOG_RELATED_LIMIT + 1
  const [settings, sameCategory, latest] = await Promise.all([
    source.getSiteSettings(locale),
    post.category
      ? source.listPosts({ locale, category: post.category.slug, page: 1, pageSize: size })
      : Promise.resolve(null),
    source.listPosts({ locale, page: 1, pageSize: size }),
  ])
  const inLocale = (posts: readonly PostSummary[]) => posts.filter((item) => item.locale === locale)

  return {
    locale,
    post,
    settings,
    related: selectRelatedPosts(post, inLocale(sameCategory?.posts ?? []), inLocale(latest.posts)),
    readingMinutes: estimateReadingMinutes(post.body),
    headings: extractHeadings(post.body, { reservedIds: BLOG_RESERVED_IDS }),
  }
}
