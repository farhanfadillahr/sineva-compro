/** Articles per page of the grid (page-patterns.md 2.6): three full rows of three columns. */
export const BLOG_PAGE_SIZE = 9

/** What Next.js hands a page as `searchParams`. */
export type RawSearchParams = Readonly<Record<string, string | string[] | undefined>>

export type BlogQuery = Readonly<{
  /** Slug of a category that exists, `null` for the unfiltered list. */
  category: string | null
  /** 1-based and not yet clamped to the number of pages. */
  page: number
}>

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

// Digits only, no leading zero, at most six of them. Anything else ("2abc", "1e3", "-1", "007")
// is read as page 1 rather than guessed at: `Number()` would accept several of those.
const PAGE = /^[1-9]\d{0,5}$/

/**
 * `?category=` and `?page=` from the URL. A category that does not exist is "no filter", not an
 * error: an old link to a removed category still lands on a working list. The Rev. 2 parameter
 * `?kategori=` is not read.
 */
export function parseBlogQuery(raw: RawSearchParams, categorySlugs: readonly string[]): BlogQuery {
  const category = first(raw.category)?.trim() ?? ''
  const page = first(raw.page)?.trim() ?? ''
  return {
    category: categorySlugs.includes(category) ? category : null,
    page: PAGE.test(page) ? Number(page) : 1,
  }
}

export const BLOG_LIST_PATH = '/blog'

/** The URL of a list view. Defaults are left out, so the first unfiltered page is plain `/blog`. */
export function blogListHref({
  category,
  page,
}: {
  category?: string | null
  page?: number
}): string {
  const params: string[] = []
  // encodeURIComponent: the slug comes from content, and `&` or `=` in it must not add or rewrite
  // a parameter.
  if (category) params.push(`category=${encodeURIComponent(category)}`)
  if (page && page > 1) params.push(`page=${page}`)
  return params.length > 0 ? `${BLOG_LIST_PATH}?${params.join('&')}` : BLOG_LIST_PATH
}

/**
 * Canonical path of a list view. A filtered list (any page) is a view of the main list, so it
 * points there. A paginated unfiltered list is its own canonical: pointing page 2 at page 1
 * would tell crawlers its articles are duplicates and hide them from the index.
 */
export function blogCanonicalPath({ category, page }: BlogQuery): string {
  return category ? BLOG_LIST_PATH : blogListHref({ page })
}

/**
 * Page numbers to show: the first and last page and the neighbours of the current one. A gap
 * that would hide a single number shows that number instead, because "..." for one page is
 * longer than the page itself.
 */
export function paginationItems(current: number, total: number): (number | 'gap')[] {
  const wanted = new Set([1, total, current - 1, current, current + 1])
  const pages = [...wanted].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((page, index) => {
    const previous = pages[index - 1]
    if (previous !== undefined && page - previous === 2) out.push(previous + 1)
    else if (previous !== undefined && page - previous > 2) out.push('gap')
    out.push(page)
  })
  return out
}

export type Pagination<T> = Readonly<{
  items: readonly T[]
  /** The page actually shown, within 1 to `totalPages`. */
  page: number
  totalPages: number
  total: number
}>

/** An out-of-range page is clamped to the nearest real one, so a stale link never shows nothing. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Pagination<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages)
  const start = (current - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    totalPages,
    total: items.length,
  }
}
