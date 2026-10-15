import 'server-only'
import { eq } from 'drizzle-orm'
import type { readServerEnv } from '../../env/server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { createAuth } from '../../lib/auth/options'
import { user } from './schema'
import { can, toPrincipal } from './authorization'
import { AccessDeniedError } from './access-errors'
import type { Capability, Principal } from './types'
export async function loadPrincipal(
  database: Database | DatabaseTransaction,
  env: ReturnType<typeof readServerEnv>,
  headers: Headers,
): Promise<Principal | null> {
  const session = await createAuth(database, env).api.getSession({
    headers,
    query: { disableCookieCache: true },
  })
  if (!session) return null
  const [current] = await database
    .select({ id: user.id, name: user.name, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, session.user.id))
  return current && !current.banned ? toPrincipal(current) : null
}
export function assertCapability(principal: Principal | null, capability: Capability): Principal {
  if (!principal) throw new AccessDeniedError('UNAUTHORIZED')
  if (!can(principal, capability)) throw new AccessDeniedError('FORBIDDEN')
  return principal
}
