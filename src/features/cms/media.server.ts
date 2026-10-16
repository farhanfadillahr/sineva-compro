import 'server-only'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import type { ContentLocale, MediaAsset } from '../content/types'
import { getPublicMedia, readMediaOrigin } from '../media/query.server'
import { parseMediaValue } from './fields'

/**
 * Public projection of a stored media value. A library reference resolves only when the file is
 * published and has alt text for the locale; anything else is `null`, which the site hides.
 */
export async function resolveMedia(
  database: Database | DatabaseTransaction,
  stored: unknown,
  locale: ContentLocale,
): Promise<MediaAsset | null> {
  const value = parseMediaValue(stored)
  if (!value) return null
  if (value.kind === 'static')
    return {
      url: value.url,
      width: value.width,
      height: value.height,
      alt: value.alt,
      blurDataUrl: null,
    }
  const media = await getPublicMedia(database, value.id, locale, readMediaOrigin())
  if (!media || !media.width || !media.height) return null
  return {
    url: media.url,
    width: media.width,
    height: media.height,
    alt: media.alt,
    blurDataUrl: media.blurDataUrl,
  }
}
