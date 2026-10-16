import { cache } from 'react'
import { getContentSource } from '@/lib/content-source'
import type { ContentLocale } from '@/features/content/types'
import { loadHomeModel } from './home-model'

/**
 * The page and `generateMetadata` both need the model; `cache` makes them share one read per
 * request instead of querying the content source twice.
 */
export const getHomeModel = cache((locale: ContentLocale) =>
  loadHomeModel(getContentSource(), locale),
)
