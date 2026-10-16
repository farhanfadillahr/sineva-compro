// Shared builders for the blog tests: generated articles and a content source over them.
import type { PublicContentSource } from '@/features/content/public'
import type { Category, PostDetail, PostSummary, RichTextDocument } from '@/features/content/types'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'

/** The DTO's mark type has no attrs yet, so documents are built through one loose cast. */
export const richText = (...paragraphs: string[]) =>
  ({
    type: 'doc',
    content: paragraphs.map((text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })),
  }) as unknown as RichTextDocument

export const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ')

export const CATEGORIES: readonly Category[] = [
  { slug: 'alpha', name: 'Alpha' },
  { slug: 'beta', name: 'Beta' },
  { slug: 'empty', name: 'Empty' },
]

/** Post `index` is newer than post `index + 1`; even indexes are alpha, odd ones beta. */
export function makePost(index: number, overrides: Partial<PostDetail> = {}): PostDetail {
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

export const many = (count: number) => Array.from({ length: count }, (_, index) => makePost(index))

/**
 * Content source over a given list. It starts from the fixture source (pages, settings) and only
 * replaces what the blog reads, with the contract's own rules: newest first and the category
 * filter applied before paging.
 */
export function sourceOf(
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
