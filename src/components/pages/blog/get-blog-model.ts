import { cache } from 'react'
import type { ContentLocale } from '@/features/content/types'
import { getContentSource } from '@/lib/content-source'
import { loadBlogListModel, loadBlogPostModel } from './blog-model'

/**
 * The page and `generateMetadata` both need the model; `cache` makes them share one read per
 * request. `cache` compares arguments by identity, so the query arrives as two strings (an object
 * would be a new key every call and the read would run twice).
 */
export const getBlogListModel = cache((locale: ContentLocale, category: string, page: string) =>
  loadBlogListModel(getContentSource(), locale, { category, page }),
)

export const getBlogPostModel = cache((slug: string, locale: ContentLocale) =>
  loadBlogPostModel(getContentSource(), slug, locale),
)
