import 'server-only'
import { and, asc, count, eq, ilike, inArray, or } from 'drizzle-orm'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import type { readServerEnv } from '../../env/server'
import { user } from '../auth/schema'
import { assertCapability, loadPrincipal } from '../auth/access.server'
import { parseUserId, parseUserList } from './input'
import { UsersServiceError } from './errors'
import type { UserPage, UserSummary } from './types'
export const userProjection = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  banned: user.banned,
}
export function userSummary(row: {
  id: string
  name: string
  email: string
  role: string | null
  banned: boolean | null
}): UserSummary {
  if (row.role !== 'admin' && row.role !== 'editor')
    throw new UsersServiceError('FORBIDDEN', 'Akun tidak dapat diubah.')
  return { id: row.id, name: row.name, email: row.email, role: row.role, active: !row.banned }
}
export async function listUsers(
  database: Database,
  env: ReturnType<typeof readServerEnv>,
  headers: Headers,
  input: unknown,
): Promise<UserPage> {
  assertCapability(await loadPrincipal(database, env, headers), 'users:manage')
  const { search, page, pageSize } = parseUserList(input)
  const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`
  const filter = and(
    inArray(user.role, ['admin', 'editor']),
    search ? or(ilike(user.name, pattern), ilike(user.email, pattern)) : undefined,
  )
  const [rows, counts] = await Promise.all([
    database
      .select(userProjection)
      .from(user)
      .where(filter)
      .orderBy(asc(user.createdAt), asc(user.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    database.select({ total: count() }).from(user).where(filter),
  ])
  return { users: rows.map(userSummary), total: counts[0].total, page, pageSize }
}
export async function getEditor(
  database: Database | DatabaseTransaction,
  env: ReturnType<typeof readServerEnv>,
  headers: Headers,
  userId: string,
): Promise<UserSummary> {
  assertCapability(await loadPrincipal(database, env, headers), 'users:manage')
  const [target] = await database
    .select(userProjection)
    .from(user)
    .where(eq(user.id, parseUserId(userId)))
  if (!target) throw new UsersServiceError('NOT_FOUND', 'Akun tidak ditemukan.')
  if (target.role !== 'editor') throw new UsersServiceError('FORBIDDEN', 'Akun tidak dapat diubah.')
  return userSummary(target)
}
