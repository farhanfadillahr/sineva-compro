import 'server-only'
import { and, count, desc, eq } from 'drizzle-orm'
import type { Database } from '../../lib/db/connection'
import type { readServerEnv } from '../../env/server'
import { assertCapability, loadPrincipal } from '../auth/access.server'
import { user } from '../auth/schema'
import { auditLog } from './schema'
import { parseAuditList } from './input'

/** Admin only, including callers of the future dashboard activity feed. */
export async function listAuditLog(
  database: Database,
  env: ReturnType<typeof readServerEnv>,
  headers: Headers,
  input: unknown,
) {
  // Existing capability is Admin-only; avoid a parallel authorization policy.
  assertCapability(await loadPrincipal(database, env, headers), 'users:manage')
  const params = parseAuditList(input)
  return database.transaction(
    async (tx) => {
      const filter = and(
        params.actor ? eq(auditLog.actorId, params.actor) : undefined,
        params.entity ? eq(auditLog.entity, params.entity) : undefined,
      )
      const [counts] = await tx.select({ total: count() }).from(auditLog).where(filter)
      const page = Math.min(params.page, Math.max(1, Math.ceil(counts.total / params.pageSize)))
      const entries = await tx
        .select({
          id: auditLog.id,
          actorId: auditLog.actorId,
          actorName: user.name,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          action: auditLog.action,
          changedFields: auditLog.changedFields,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .leftJoin(user, eq(auditLog.actorId, user.id))
        .where(filter)
        .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
        .limit(params.pageSize)
        .offset((page - 1) * params.pageSize)
      return { entries, total: counts.total, ...params, page }
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' },
  )
}
