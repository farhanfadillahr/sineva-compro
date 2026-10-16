import 'server-only'
import { asc, eq, inArray, sql } from 'drizzle-orm'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import type { readServerEnv } from '../../env/server'
import { createAuth } from '../../lib/auth/options'
import { user } from '../auth/schema'
import { assertCapability, loadPrincipal } from '../auth/access.server'
import { AccessDeniedError } from '../auth/access-errors'
import type { Principal } from '../auth/types'
import { writeAudit } from '../audit/service.server'
import {
  parseCreateEditor,
  parseUpdateEditor,
  parseEditorStatus,
  parseEditorPassword,
} from './input'
import { safeUsersError, UsersServiceError } from './errors'
import { userProjection, userSummary } from './query.server'
import type { UserSummary } from './types'
type Env = ReturnType<typeof readServerEnv>
async function mutation<T>(
  database: Database,
  env: Env,
  headers: Headers,
  targetId: string | undefined,
  run: (
    tx: DatabaseTransaction,
    auth: ReturnType<typeof createAuth>,
    actor: Principal,
  ) => Promise<T>,
): Promise<T> {
  try {
    return await database.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
      const actor = assertCapability(await loadPrincipal(tx, env, headers), 'users:manage')
      const ids = targetId ? [actor.id, targetId] : [actor.id]
      const rows = await tx
        .select(userProjection)
        .from(user)
        .where(inArray(user.id, ids))
        .orderBy(asc(user.id))
        .for('update')
      const latest = assertCapability(await loadPrincipal(tx, env, headers), 'users:manage')
      if (latest.id !== actor.id) throw new AccessDeniedError('FORBIDDEN')
      if (targetId) {
        const target = rows.find((row) => row.id === targetId)
        if (!target) throw new UsersServiceError('NOT_FOUND', 'Akun tidak ditemukan.')
        if (targetId === actor.id || target.role !== 'editor')
          throw new AccessDeniedError('FORBIDDEN')
      }
      return run(tx, createAuth(tx, env), latest)
    })
  } catch (error) {
    throw safeUsersError(error)
  }
}
async function authenticate(database: Database, env: Env, headers: Headers) {
  assertCapability(await loadPrincipal(database, env, headers), 'users:manage')
}
async function summary(tx: DatabaseTransaction, id: string) {
  const [row] = await tx.select(userProjection).from(user).where(eq(user.id, id))
  return userSummary(row)
}
export async function createEditor(
  database: Database,
  env: Env,
  headers: Headers,
  input: unknown,
): Promise<UserSummary> {
  await authenticate(database, env, headers)
  const data = parseCreateEditor(input)
  return mutation(database, env, headers, undefined, async (tx, auth, actor) => {
    const created = await auth.api.createUser({ headers, body: { ...data, role: 'editor' } })
    await writeAudit(tx, actor, {
      entity: 'users',
      entityId: created.user.id,
      action: 'create',
      changedFields: ['name', 'email', 'role', 'active', 'password'],
    })
    return summary(tx, created.user.id)
  })
}
export async function updateEditor(
  database: Database,
  env: Env,
  headers: Headers,
  input: unknown,
): Promise<UserSummary> {
  await authenticate(database, env, headers)
  const data = parseUpdateEditor(input)
  return mutation(database, env, headers, data.userId, async (tx, auth, actor) => {
    const [before] = await tx
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, data.userId))
    await auth.api.adminUpdateUser({
      headers,
      body: { userId: data.userId, data: { name: data.name, email: data.email } },
    })
    if (before.email !== data.email)
      await auth.api.revokeUserSessions({ headers, body: { userId: data.userId } })
    const changedFields = [
      ...(before.name !== data.name ? ['name'] : []),
      ...(before.email !== data.email ? ['email'] : []),
    ]
    if (changedFields.length)
      await writeAudit(tx, actor, {
        entity: 'users',
        entityId: data.userId,
        action: 'update',
        changedFields,
      })
    return summary(tx, data.userId)
  })
}
export async function setEditorActive(
  database: Database,
  env: Env,
  headers: Headers,
  input: unknown,
): Promise<{ success: true }> {
  await authenticate(database, env, headers)
  const data = parseEditorStatus(input)
  return mutation(database, env, headers, data.userId, async (tx, auth, actor) => {
    if (data.active) await auth.api.unbanUser({ headers, body: { userId: data.userId } })
    else
      await auth.api.banUser({
        headers,
        body: { userId: data.userId, banReason: 'Dinonaktifkan oleh Admin' },
      })
    await auth.api.revokeUserSessions({ headers, body: { userId: data.userId } })
    await writeAudit(tx, actor, {
      entity: 'users',
      entityId: data.userId,
      action: data.active ? 'activate' : 'deactivate',
      changedFields: ['active'],
    })
    return { success: true }
  })
}
export async function changeEditorPassword(
  database: Database,
  env: Env,
  headers: Headers,
  input: unknown,
): Promise<{ success: true }> {
  await authenticate(database, env, headers)
  const data = parseEditorPassword(input)
  return mutation(database, env, headers, data.userId, async (tx, auth, actor) => {
    await auth.api.setUserPassword({ headers, body: data })
    await auth.api.revokeUserSessions({ headers, body: { userId: data.userId } })
    await writeAudit(tx, actor, {
      entity: 'users',
      entityId: data.userId,
      action: 'password_change',
      changedFields: ['password'],
    })
    return { success: true }
  })
}
