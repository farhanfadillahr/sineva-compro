import { cache } from 'react'
import type { ContentLocale } from '@/features/content/types'
import { getContentSource } from '@/lib/content-source'
import { loadContactModel, loadThankYouModel } from './contact-model'

/**
 * The page and `generateMetadata` both need the model; `cache` makes them share one read per
 * request instead of querying the content source twice.
 */
export const getContactModel = cache((locale: ContentLocale) =>
  loadContactModel(getContentSource(), locale),
)

export const getThankYouModel = cache((locale: ContentLocale) =>
  loadThankYouModel(getContentSource(), locale),
)
