import { and, eq, ne } from 'drizzle-orm'
import type { DatabaseTransaction } from '../../src/lib/db/connection'
import { auditLog } from '../../src/features/audit/schema'
import { account, session, user } from '../../src/features/auth/schema'
import type { SeedModule } from './types'

export const auditDemoId = '00000000-0000-4000-8000-000000000087'
export const auditDemoActorId = 'demo:cpr-87:actor'
const identity = {
  id: auditDemoActorId,
  name: '[Demo] Audit actor',
  email: 'audit-cpr87@example.com',
  role: 'editor',
  banned: true,
}
const entityId = 'demo:cpr-87:record'

async function ownedMarker(tx: DatabaseTransaction) {
  const [row] = await tx.select().from(auditLog).where(eq(auditLog.id, auditDemoId)).for('update')
  if (
    row &&
    (!row.isDemo ||
      row.actorId !== auditDemoActorId ||
      row.entity !== 'users' ||
      row.entityId !== entityId ||
      row.action !== 'create')
  )
    throw new Error('Reserved audit seed ID belongs to another record')
  return row
}
async function demo(tx: DatabaseTransaction) {
  const marker = await ownedMarker(tx)
  const [actor] = await tx.select().from(user).where(eq(user.id, auditDemoActorId)).for('update')
  if (marker) return
  // Never adopt an existing user, even if its ID/name resembles a demo user.
  if (actor) throw new Error('Reserved audit seed actor already exists; no records changed')
  await tx.insert(user).values(identity)
  // The marker and actor are created together. The actor has no credentials and
  // is banned; it cannot authenticate. This marker is the purge ownership proof.
  await tx
    .insert(auditLog)
    .values({
      id: auditDemoId,
      actorId: auditDemoActorId,
      entity: 'users',
      entityId,
      action: 'create',
      changedFields: ['active', 'name', 'role'],
      isDemo: true,
    })
}
async function purgeDemo(tx: DatabaseTransaction) {
  const marker = await ownedMarker(tx)
  if (!marker) return
  const [actor] = await tx.select().from(user).where(eq(user.id, auditDemoActorId)).for('update')
  const otherLogs = await tx
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(and(eq(auditLog.actorId, auditDemoActorId), ne(auditLog.id, auditDemoId)))
    .limit(1)
  const credentials = await tx
    .select({ id: account.id })
    .from(account)
    .where(eq(account.userId, auditDemoActorId))
    .limit(1)
  const sessions = await tx
    .select({ id: session.id })
    .from(session)
    .where(eq(session.userId, auditDemoActorId))
    .limit(1)
  await tx.delete(auditLog).where(and(eq(auditLog.id, auditDemoId), eq(auditLog.isDemo, true)))
  if (
    actor &&
    actor.name === identity.name &&
    actor.email === identity.email &&
    actor.role === identity.role &&
    actor.banned === true &&
    !actor.image &&
    !actor.emailVerified &&
    !otherLogs.length &&
    !credentials.length &&
    !sessions.length
  ) {
    await tx.delete(user).where(eq(user.id, auditDemoActorId))
  }
}
export const auditSeed: SeedModule = {
  key: 'audit',
  // Audit has no structural rows; base deliberately writes no fabricated events.
  async base() {},
  demo,
  purgeDemo,
}
