import 'server-only'
import { routing } from '../../i18n/routing'
import { and, eq, isNull } from 'drizzle-orm'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import type { MediaAsset } from '../content/types'
import { media, mediaDelivery, mediaTranslation } from './schema'
export type PublishedMedia = Omit<MediaAsset, 'width' | 'height'> & {
  width: number | null
  height: number | null
  dominantColor: string | null
}
export function publicMediaUrl(asset: { id: string; extension: string }, origin = '') {
  return `${origin}/api/media/public/${asset.id}.${asset.extension}`
}
export function readMediaOrigin(input = process.env.MEDIA_PUBLIC_ORIGIN) {
  if (!input) return ''
  try {
    const url = new URL(input)
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      !['http:', 'https:'].includes(url.protocol) ||
      (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'https:')
    )
      throw new Error()
    return url.origin
  } catch {
    throw new Error('Invalid MEDIA_PUBLIC_ORIGIN')
  }
}
export async function getPublicMedia(
  database: Database | DatabaseTransaction,
  id: string,
  locale: string,
  origin = '',
  prefix = process.env.MEDIA_PREFIX ?? 'local',
): Promise<PublishedMedia | null> {
  if (!(routing.locales as readonly string[]).includes(locale)) return null
  const [row] = await database
    .select({
      assetId: mediaDelivery.id,
      extension: mediaDelivery.extension,
      alt: mediaTranslation.alt,
      width: media.width,
      height: media.height,
      dominantColor: media.dominantColor,
    })
    .from(media)
    .innerJoin(mediaDelivery, eq(media.publicAssetId, mediaDelivery.id))
    .innerJoin(
      mediaTranslation,
      and(eq(mediaTranslation.mediaId, media.id), eq(mediaTranslation.locale, locale)),
    )
    .where(and(eq(media.id, id), eq(media.environment, prefix), isNull(media.deletedAt)))
  if (!row?.alt.trim()) return null
  return {
    url: publicMediaUrl({ id: row.assetId, extension: row.extension }, origin),
    alt: row.alt,
    width: row.width,
    height: row.height,
    dominantColor: row.dominantColor,
    blurDataUrl: null,
  }
}
