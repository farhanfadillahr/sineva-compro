import { describe, expect, it } from 'vitest'
import {
  BLOG_RESERVED_IDS,
  blogPostHref,
  loadBlogListModel,
  loadBlogPostModel,
  selectRelatedPosts,
} from '@/components/pages/blog/blog-model'
import { estimateReadingMinutes, WORDS_PER_MINUTE } from '@/components/pages/blog/reading-time'
import type {
  Category,
  ContentLocale,
  PostDetail,
  PostSummary,
  RichTextDocument,
} from '@/features/content/types'
import type { PublicContentSource } from '@/features/content/public'
import { createStaticContentSource, staticContent } from '../../src/content/static'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'

const richText = (...paragraphs: string[]) =>
  ({
    type: 'doc',
    content: paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
  }) as unknown as RichTextDocument

const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ')

describe('estimateReadingMinutes', () => {
  it('documents the formula: 200 words per minute, rounded up, never below 1', () => {
    expect(WORDS_PER_MINUTE).toBe(200)
  })

  it.each([
    [0, 1],
    [1, 1],
    [200, 1],
    [201, 2],
    [400, 2],
    [401, 3],
    [1000, 5],
  ])('%i words read in %i min', (count, minutes) => {
    expect(estimateReadingMinutes(richText(words(count)))).toBe(minutes)
  })

  it('counts words over every paragraph', () => {
    expect(estimateReadingMinutes(richText(words(150), words(100)))).toBe(2)
  })

  it('agrees with the minutes the static content already carries for each article', () => {
    for (const post of staticContent.postDetails) {
      expect(estimateReadingMinutes(post.body), post.slug).toBe(post.readingMinutes)
    }
  })
})

// A list of generated posts, newest first, spread over two categories.
const CATEGORIES: readonly Category[] = [
  { slug: 'alpha', name: 'Alpha' },
  { slug: 'beta', name: 'Beta' },
  { slug: 'empty', name: 'Empty' },
]

function makePost(index: number, overrides: Partial<PostDetail> = {}): PostDetail {
  const day = String(28 - index).padStart(2, '0')
  return {
    slug: `post-${index}`,
    locale: 'en',
    title: `Post ${index}`,
    excerpt: `Excerpt ${index}`,
    cover: null,
    category: CATEGORIES[index % 2]!,
    author: null,
    publishedAt: `2026-09-${day}T09:00:00.000Z`,
    readingMinutes: 1,
    body: richText('body'),
    updatedAt: null,
    seo: {
      metaTitle: `Post ${index}`,
      metaDescription: 'd',
      ogImage: null,
      canonicalUrl: null,
      noindex: false,
    },
    ...overrides,
  }
}

/**
 * Content source over a given list. It starts from the fixture source (pages, settings) and only
 * replaces what the blog reads, with the contract's own rules: newest first, page and pageSize
 * validated, category filter applied before paging.
 */
function sourceOf(
  details: readonly PostDetail[],
  { leakOtherLocales = false }: { leakOtherLocales?: boolean } = {},
): PublicContentSource {
  const base = createFixtureContentSource()
  const summary = (post: PostDetail): PostSummary => ({
    slug: post.slug,
    locale: post.locale,
    title: post.title,
    excerpt: post.excerpt,
    cover: post.cover,
    category: post.category,
    author: post.author,
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
  })
  return {
    ...base,
    async listCategories() {
      return CATEGORIES
    },
    async listPosts({ locale, category, page, pageSize }) {
      const matching = details
        // A source that is correct only returns the asked locale. `leakOtherLocales` models the
        // regression this page must survive: rows of another locale slipping through a query.
        .filter((post) => leakOtherLocales || post.locale === locale)
        .filter((post) => category === undefined || post.category?.slug === category)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      const start = (page - 1) * pageSize
      return {
        posts: matching.slice(start, start + pageSize).map(summary),
        total: matching.length,
        page,
        pageSize,
      }
    },
    async getPost(slug) {
      return details.find((post) => post.slug === slug) ?? null
    },
  }
}

const many = (count: number) => Array.from({ length: count }, (_, index) => makePost(index))

describe('loadBlogListModel', () => {
  it('returns null when the locale has no Blog page content', async () => {
    const source = createStaticContentSource()
    expect(await loadBlogListModel(source, 'xx' as ContentLocale, {})).toBeNull()
  })

  it('features the latest article and lists the others in the grid', async () => {
    const model = await loadBlogListModel(sourceOf(many(5)), 'en', {})
    expect(model!.featured?.slug).toBe('post-0')
    expect(model!.posts.map((post) => post.slug)).toEqual(['post-1', 'post-2', 'post-3', 'post-4'])
    expect(model!.isEmpty).toBe(false)
  })

  it('paginates the grid by 9 and reports the page count', async () => {
    // 1 featured + 19 in the grid: 9, 9, 1.
    const source = sourceOf(many(20))
    const first = await loadBlogListModel(source, 'en', {})
    expect(first!.posts).toHaveLength(9)
    expect(first!.pagination).toEqual({ page: 1, totalPages: 3, total: 19 })
    const second = await loadBlogListModel(source, 'en', { page: '2' })
    expect(second!.posts.map((post) => post.slug)).toEqual(
      Array.from({ length: 9 }, (_, index) => `post-${index + 10}`),
    )
    const third = await loadBlogListModel(source, 'en', { page: '3' })
    expect(third!.posts.map((post) => post.slug)).toEqual(['post-19'])
  })

  it('shows the featured article on page 1 only, so it is never repeated in the grid', async () => {
    const source = sourceOf(many(20))
    expect((await loadBlogListModel(source, 'en', { page: '1' }))!.featured?.slug).toBe('post-0')
    const second = await loadBlogListModel(source, 'en', { page: '2' })
    expect(second!.featured).toBeNull()
    const all = [
      ...(await loadBlogListModel(source, 'en', { page: '1' }))!.posts,
      ...second!.posts,
      ...(await loadBlogListModel(source, 'en', { page: '3' }))!.posts,
    ]
    expect(all.map((post) => post.slug)).not.toContain('post-0')
    expect(new Set(all.map((post) => post.slug)).size).toBe(all.length)
  })

  it('clamps a page past the end to the last page, without an error', async () => {
    const model = await loadBlogListModel(sourceOf(many(20)), 'en', { page: '99' })
    expect(model!.query.page).toBe(3)
    expect(model!.posts.map((post) => post.slug)).toEqual(['post-19'])
  })

  it('filters by category: no featured card, and only that category in the grid', async () => {
    const model = await loadBlogListModel(sourceOf(many(10)), 'en', { category: 'beta' })
    expect(model!.activeCategory).toBe('beta')
    expect(model!.featured).toBeNull()
    expect(model!.posts.length).toBeGreaterThan(0)
    expect(model!.posts.every((post) => post.category?.slug === 'beta')).toBe(true)
    expect(model!.query).toEqual({ category: 'beta', page: 1 })
  })

  it('renders the empty state for a known category without articles', async () => {
    const model = await loadBlogListModel(sourceOf(many(10)), 'en', { category: 'empty' })
    expect(model!.activeCategory).toBe('empty')
    expect(model!.isEmpty).toBe(true)
    expect(model!.posts).toEqual([])
    expect(model!.featured).toBeNull()
  })

  it('treats an unknown category as the unfiltered list, without an error', async () => {
    const model = await loadBlogListModel(sourceOf(many(5)), 'en', { category: 'nope' })
    expect(model!.activeCategory).toBeNull()
    expect(model!.featured?.slug).toBe('post-0')
    expect(model!.query.category).toBeNull()
  })

  it('renders the empty state when there are no articles at all', async () => {
    const model = await loadBlogListModel(sourceOf([]), 'en', {})
    expect(model!.isEmpty).toBe(true)
    expect(model!.featured).toBeNull()
    expect(model!.posts).toEqual([])
    expect(model!.pagination.totalPages).toBe(1)
  })

  it('has a featured card and no grid or empty state for a single article', async () => {
    const model = await loadBlogListModel(sourceOf(many(1)), 'en', {})
    expect(model!.featured?.slug).toBe('post-0')
    expect(model!.posts).toEqual([])
    expect(model!.isEmpty).toBe(false)
  })

  it('lists the categories of the locale for the filter row', async () => {
    const model = await loadBlogListModel(sourceOf(many(2)), 'en', {})
    expect(model!.categories.map((category) => category.slug)).toEqual(['alpha', 'beta', 'empty'])
  })

  it('does not list an article that exists only in another locale', async () => {
    const onlyOtherLocale = makePost(99, {
      slug: 'hanya-bahasa-indonesia',
      // The second locale is not enabled in routing yet, so the type does not know it.
      locale: 'id' as ContentLocale,
      publishedAt: '2026-10-30T09:00:00.000Z',
    })
    const source = sourceOf([...many(3), onlyOtherLocale], { leakOtherLocales: true })
    const model = await loadBlogListModel(source, 'en', {})
    const shown = [model!.featured, ...model!.posts].map((post) => post?.slug)
    expect(shown).not.toContain('hanya-bahasa-indonesia')
    // The newest article overall is the Indonesian one: it must not become the featured card.
    expect(model!.featured?.slug).toBe('post-0')
  })

  it('lists the real static articles newest first', async () => {
    const model = await loadBlogListModel(createStaticContentSource(), 'en', {})
    expect(model!.featured?.slug).toBe('where-to-start-with-ai-in-a-small-business')
    expect(model!.posts).toHaveLength(2)
  })
})

describe('selectRelatedPosts', () => {
  const posts = many(8)
  const summaries = posts as readonly PostSummary[]
  const current = posts[1]! // beta
  const sameCategory = summaries.filter((post) => post.category?.slug === 'beta')

  it('never includes the article itself', () => {
    const related = selectRelatedPosts(current, sameCategory, summaries)
    expect(related.map((post) => post.slug)).not.toContain(current.slug)
  })

  it('puts articles of the same category first, then fills with the latest', () => {
    const related = selectRelatedPosts(
      current,
      [summaries[3]!], // one sibling in the category
      summaries,
    )
    expect(related.map((post) => post.slug)).toEqual(['post-3', 'post-0', 'post-2'])
  })

  it('holds at most 3 articles', () => {
    expect(selectRelatedPosts(current, sameCategory, summaries)).toHaveLength(3)
  })

  it('does not repeat an article that is both in the category list and in the latest list', () => {
    const related = selectRelatedPosts(current, sameCategory, summaries)
    expect(new Set(related.map((post) => post.slug)).size).toBe(related.length)
  })

  it('returns fewer than 3 when the site has fewer other articles', () => {
    const two = many(2)
    expect(selectRelatedPosts(two[0]!, [], two).map((post) => post.slug)).toEqual(['post-1'])
    expect(selectRelatedPosts(two[0]!, [], [two[0]!])).toEqual([])
  })

  it('falls back to the latest when the article has no category', () => {
    const uncategorised = makePost(50, { category: null })
    const related = selectRelatedPosts(uncategorised, [], summaries)
    expect(related.map((post) => post.slug)).toEqual(['post-0', 'post-1', 'post-2'])
  })
})

describe('loadBlogPostModel', () => {
  it('loads an article with its related articles, reading time and headings', async () => {
    const source = createStaticContentSource()
    const slug = 'five-everyday-tasks-an-ai-agent-can-take-off-your-plate'
    const model = await loadBlogPostModel(source, slug, 'en')
    expect(model!.post.slug).toBe(slug)
    expect(model!.readingMinutes).toBe(model!.post.readingMinutes)
    expect(model!.headings.length).toBeGreaterThan(3)
    expect(model!.headings.every((heading) => heading.level === 2 || heading.level === 3)).toBe(
      true,
    )
    // Three articles on the site, so the two others fill the related list.
    expect(model!.related).toHaveLength(2)
    expect(model!.related.map((post) => post.slug)).not.toContain(slug)
  })

  it('takes the same-category articles first', async () => {
    const source = sourceOf(many(8))
    const model = await loadBlogPostModel(source, 'post-1', 'en') // beta
    expect(model!.related.map((post) => post.slug)).toEqual(['post-3', 'post-5', 'post-7'])
  })

  it('is null for an unknown slug', async () => {
    expect(await loadBlogPostModel(createStaticContentSource(), 'unknown', 'en')).toBeNull()
  })

  it('is null for an article that exists only in another locale', async () => {
    const other = makePost(7, { slug: 'solo-id', locale: 'id' as ContentLocale })
    expect(await loadBlogPostModel(sourceOf([other]), 'solo-id', 'en')).toBeNull()
  })

  it('computes read time from the body, not from the stored number', async () => {
    const long = makePost(4, { slug: 'long', body: richText(words(650)), readingMinutes: 1 })
    const model = await loadBlogPostModel(sourceOf([long]), 'long', 'en')
    expect(model!.readingMinutes).toBe(4)
  })

  it('reserves the page ids so a heading can never collide with them', async () => {
    const heading = {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Final CTA' }],
    }
    const post = makePost(2, {
      slug: 'ids',
      body: { type: 'doc', content: [heading] } as unknown as RichTextDocument,
    })
    const model = await loadBlogPostModel(sourceOf([post]), 'ids', 'en')
    expect(BLOG_RESERVED_IDS).toContain('final-cta')
    expect(model!.headings.map((h) => h.id)).toEqual(['final-cta-2'])
  })
})

describe('blogPostHref', () => {
  it('links an article under /blog', () => {
    expect(blogPostHref('my-post')).toBe('/blog/my-post')
  })

  it('encodes the slug', () => {
    expect(blogPostHref('a b/c')).toBe('/blog/a%20b%2Fc')
  })
})
