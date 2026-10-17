import 'server-only'
import type { DatabaseTransaction } from '../../lib/db/connection'
import type { Principal } from '../auth/types'
import { assertCapability } from '../auth/access.server'
import { parseAuditEntry, type AuditEntryInput } from './input'
import { auditLog } from './schema'

/** Call after authorization and mutation, with the SAME transaction. Never catch
 * an audit failure inside that transaction: it must abort the entire mutation.
 * The caller supplies a principal loaded from its server session, never a form.
 */
export async function writeAudit(
  tx: DatabaseTransaction,
  actor: Principal,
  input: AuditEntryInput,
): Promise<void> {
  assertCapability(actor, 'content:write')
  const entry = parseAuditEntry(input)
  await tx
    .insert(auditLog)
    .values({ actorId: actor.id, ...entry, changedFields: [...entry.changedFields] })
}

/**
 * Audit entry for work the system does on its own, such as retention deletions (CPR-111). There is
 * no principal, so `actor_id` stays null; the entry is still validated like any other.
 */
export async function writeSystemAudit(
  tx: DatabaseTransaction,
  input: AuditEntryInput,
): Promise<void> {
  const entry = parseAuditEntry(input)
  await tx
    .insert(auditLog)
    .values({ actorId: null, ...entry, changedFields: [...entry.changedFields] })
}
