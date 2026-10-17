import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import { revalidateChange } from '../cms/revalidate.server'
import { mediaUsage } from './schema'
import { mediaUsageChanges } from './usage-changes'

/**
 * Refreshes every public page that shows this media (CPR-103). Called by the media routes after
 * the change has committed, so a failed save never refreshes anything. Without it, new alt text or
 * a replaced file stayed invisible until the page that uses it was saved again.
 */
export async function revalidateMediaUsage(mediaId: string): Promise<void> {
  const owners = await db
    .select({ entity: mediaUsage.entity, entityId: mediaUsage.entityId })
    .from(mediaUsage)
    .where(eq(mediaUsage.mediaId, mediaId))
  for (const change of mediaUsageChanges(owners)) revalidateChange(change)
}
