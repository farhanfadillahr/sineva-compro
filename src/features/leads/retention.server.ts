import 'server-only'
import { lt, sql } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import type { Database } from '../../lib/db/connection'
import { writeSystemAudit } from '../audit/service.server'
import { lead } from './schema'

/** The privacy policy (CPR-17): contact messages are kept 24 months after the last contact. */
export const LEAD_RETENTION_MONTHS = 24

/**
 * Deletes every lead whose last contact is older than the retention period (CPR-111). The last
 * contact is the later of when it arrived and when the team last changed it (status or notes).
 * Each deletion gets a system audit entry naming the record, never the person's data, in the same
 * transaction. Returns how many were deleted.
 */
export async function purgeExpiredLeads(now = new Date(), database: Database = db) {
  const cutoff = new Date(now)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - LEAD_RETENTION_MONTHS)
  return database.transaction(async (tx) => {
    const removed = await tx
      .delete(lead)
      .where(lt(sql`greatest(${lead.createdAt}, ${lead.updatedAt})`, cutoff))
      .returning({ id: lead.id })
    for (const { id } of removed)
      await writeSystemAudit(tx, {
        entity: 'leads',
        entityId: id,
        action: 'expire',
        changedFields: ['name', 'email', 'phone', 'message'],
      })
    return removed.length
  })
}
