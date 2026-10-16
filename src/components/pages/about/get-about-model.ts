import { cache } from 'react'
import { getContentSource } from '@/lib/content-source'
import type { ContentLocale } from '@/features/content/types'
import { loadAboutModel } from './about-model'

/**
 * The page and `generateMetadata` both need the model; `cache` makes them share one read per
 * request instead of querying the content source twice.
 */
export const getAboutModel = cache((locale: ContentLocale) =>
  loadAboutModel(getContentSource(), locale),
)
