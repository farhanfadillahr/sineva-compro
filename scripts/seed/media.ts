import { and, eq } from 'drizzle-orm'
import type { SeedModule } from './types'
import { media, mediaDelivery, mediaTranslation, mediaUsage } from '../../src/features/media/schema'
import { assertPrefix } from '../../src/lib/media/store'
export const mediaDemoId = 'c0230000-0000-4000-8000-000000000001'
const hash = '0'.repeat(64),
  filename = '[Demo] Metadata media.png'
/** Offline metadata fixture only. Never fabricate a real upload or publish a missing object. */
export const mediaSeed: SeedModule = {
  key: 'media',
  async base() {},
  async demo(tx) {
    const [existing] = await tx.select().from(media).where(eq(media.id, mediaDemoId)).for('update')
    if (existing) {
      if (!existing.isDemo) throw new Error('Reserved media demo ID belongs to real data')
      return
    }
    const environment = assertPrefix(process.env.MEDIA_PREFIX ?? 'local')
    await tx.insert(media).values({
      id: mediaDemoId,
      environment,
      filename,
      kind: 'image',
      contentType: 'image/png',
      extension: 'png',
      size: 1,
      privateKey: `${environment}/demo/cpr23-metadata-only.png`,
      hash,
      width: 1,
      height: 1,
      isDemo: true,
    })
    await tx
      .insert(mediaTranslation)
      .values({ mediaId: mediaDemoId, locale: 'en', alt: 'Demo metadata fixture', caption: '' })
  },
  async purgeDemo(tx) {
    const [row] = await tx.select().from(media).where(eq(media.id, mediaDemoId)).for('update')
    if (
      !row ||
      !row.isDemo ||
      row.filename !== filename ||
      row.hash !== hash ||
      row.credit ||
      row.focalX !== 0.5 ||
      row.focalY !== 0.5 ||
      row.width !== 1 ||
      row.height !== 1 ||
      row.kind !== 'image' ||
      row.contentType !== 'image/png' ||
      row.extension !== 'png' ||
      row.size !== 1 ||
      row.createdBy !== null ||
      row.dominantColor !== null ||
      row.cleanupPending ||
      row.privateKey !== `${row.environment}/demo/cpr23-metadata-only.png` ||
      row.publicAssetId ||
      row.deletedAt ||
      row.createdAt.getTime() !== row.updatedAt.getTime()
    )
      return
    const used = await tx
      .select({ id: mediaUsage.id })
      .from(mediaUsage)
      .where(eq(mediaUsage.mediaId, mediaDemoId))
      .limit(1)
    const delivered = await tx
      .select({ id: mediaDelivery.id })
      .from(mediaDelivery)
      .where(eq(mediaDelivery.mediaId, mediaDemoId))
      .limit(1)
    const translations = await tx
      .select()
      .from(mediaTranslation)
      .where(eq(mediaTranslation.mediaId, mediaDemoId))
    if (
      used.length ||
      delivered.length ||
      translations.length !== 1 ||
      translations[0].locale !== 'en' ||
      translations[0].alt !== 'Demo metadata fixture' ||
      translations[0].caption
    )
      return
    await tx.delete(media).where(and(eq(media.id, mediaDemoId), eq(media.isDemo, true)))
  },
}
