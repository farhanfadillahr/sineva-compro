import { cache } from 'react'
import type { ContentLocale } from '@/features/content/types'
import { getContentSource } from '@/lib/content-source'
import { loadServiceDetailModel, loadServicesListModel } from './services-model'

/**
 * The page and `generateMetadata` both need the model; `cache` makes them share one read per
 * request instead of querying the content source twice.
 */
export const getServicesListModel = cache((locale: ContentLocale) =>
  loadServicesListModel(getContentSource(), locale),
)

export const getServiceDetailModel = cache((slug: string, locale: ContentLocale) =>
  loadServiceDetailModel(getContentSource(), slug, locale),
)
