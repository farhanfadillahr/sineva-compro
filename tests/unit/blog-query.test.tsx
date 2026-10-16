import { describe, expect, it } from 'vitest'
import {
  BLOG_PAGE_SIZE,
  blogCanonicalPath,
  blogListHref,
  paginate,
  paginationItems,
  parseBlogQuery,
} from '@/components/pages/blog/blog-query'

const CATEGORIES = ['ai-basics', 'small-business']

describe('BLOG_PAGE_SIZE', () => {
  it('is 9, three full rows of the three-column grid', () => {
    expect(BLOG_PAGE_SIZE).toBe(9)
  })
})

describe('parseBlogQuery', () => {
  it('defaults to no category and page 1', () => {
    expect(parseBlogQuery({}, CATEGORIES)).toEqual({ category: null, page: 1 })
  })

  it('accepts a known category slug', () => {
    expect(parseBlogQuery({ category: 'ai-basics' }, CATEGORIES)).toEqual({
      category: 'ai-basics',
      page: 1,
    })
  })

  it('treats an unknown category as no filter instead of an error', () => {
    expect(parseBlogQuery({ category: 'does-not-exist' }, CATEGORIES).category).toBeNull()
    expect(parseBlogQuery({ category: '' }, CATEGORIES).category).toBeNull()
    expect(parseBlogQuery({ category: '__proto__' }, CATEGORIES).category).toBeNull()
  })

  it('does not match a category by prefix, case or surrounding noise', () => {
    expect(parseBlogQuery({ category: 'ai' }, CATEGORIES).category).toBeNull()
    expect(parseBlogQuery({ category: 'AI-BASICS' }, CATEGORIES).category).toBeNull()
    expect(parseBlogQuery({ category: ' ai-basics ' }, CATEGORIES).category).toBe('ai-basics')
  })

  it('uses the first value when a parameter is repeated', () => {
    expect(parseBlogQuery({ category: ['small-business', 'ai-basics'] }, CATEGORIES).category).toBe(
      'small-business',
    )
    expect(parseBlogQuery({ page: ['3', '2'] }, CATEGORIES).page).toBe(3)
  })

  it.each([
    ['2', 2],
    ['10', 10],
    ['1', 1],
    ['0', 1],
    ['-1', 1],
    ['1.5', 1],
    ['2abc', 1],
    ['1e3', 1],
    ['', 1],
    ['abc', 1],
    ['9999999', 1],
    ['007', 1],
  ])('reads page %j as %i', (raw, expected) => {
    expect(parseBlogQuery({ page: raw }, CATEGORIES).page).toBe(expected)
  })

  it('ignores the Indonesian ?kategori= parameter of Rev. 2', () => {
    expect(parseBlogQuery({ kategori: 'ai-basics' }, CATEGORIES).category).toBeNull()
  })
})

describe('blogListHref', () => {
  it('is /blog for the unfiltered first page', () => {
    expect(blogListHref({})).toBe('/blog')
    expect(blogListHref({ category: null, page: 1 })).toBe('/blog')
  })

  it('adds only what differs from the default', () => {
    expect(blogListHref({ category: 'ai-basics' })).toBe('/blog?category=ai-basics')
    expect(blogListHref({ page: 2 })).toBe('/blog?page=2')
    expect(blogListHref({ category: 'ai-basics', page: 3 })).toBe('/blog?category=ai-basics&page=3')
  })

  it('encodes the category so it cannot add or rewrite parameters', () => {
    expect(blogListHref({ category: 'a&page=9' })).toBe('/blog?category=a%26page%3D9')
  })
})

describe('blogCanonicalPath', () => {
  it('points a filtered list at the main list', () => {
    expect(blogCanonicalPath({ category: 'ai-basics', page: 1 })).toBe('/blog')
  })

  it('points a filtered and paginated list at the main list too', () => {
    expect(blogCanonicalPath({ category: 'ai-basics', page: 2 })).toBe('/blog')
  })

  it('keeps the unfiltered first page on /blog', () => {
    expect(blogCanonicalPath({ category: null, page: 1 })).toBe('/blog')
  })

  it('makes an unfiltered paginated page its own canonical', () => {
    expect(blogCanonicalPath({ category: null, page: 2 })).toBe('/blog?page=2')
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 20 }, (_, index) => index + 1)

  it('slices 9 per page and counts the pages', () => {
    const first = paginate(items, 1, 9)
    expect(first.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(first.totalPages).toBe(3)
    expect(first.total).toBe(20)
    expect(paginate(items, 2, 9).items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(paginate(items, 3, 9).items).toEqual([19, 20])
  })

  it('has exactly one page for exactly one page of items', () => {
    expect(paginate(items.slice(0, 9), 1, 9).totalPages).toBe(1)
    expect(paginate(items.slice(0, 10), 1, 9).totalPages).toBe(2)
  })

  it('has one empty page when there is nothing', () => {
    expect(paginate([], 1, 9)).toEqual({ items: [], page: 1, totalPages: 1, total: 0 })
  })

  it('clamps a page past the end to the last page instead of showing nothing', () => {
    const result = paginate(items, 99, 9)
    expect(result.page).toBe(3)
    expect(result.items).toEqual([19, 20])
  })

  it('clamps a page below 1 to the first page', () => {
    expect(paginate(items, 0, 9).page).toBe(1)
    expect(paginate(items, -4, 9).page).toBe(1)
  })
})

describe('paginationItems', () => {
  it('lists every page of a short range', () => {
    expect(paginationItems(1, 1)).toEqual([1])
    expect(paginationItems(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps the first and last page and the neighbours of the current one', () => {
    expect(paginationItems(1, 10)).toEqual([1, 2, 'gap', 10])
    expect(paginationItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
    expect(paginationItems(10, 10)).toEqual([1, 'gap', 9, 10])
  })

  it('shows a single missing page instead of a gap that hides just one number', () => {
    expect(paginationItems(4, 8)).toEqual([1, 2, 3, 4, 5, 'gap', 8])
  })
})
