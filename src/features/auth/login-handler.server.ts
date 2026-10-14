import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { APIError } from 'better-auth/api'
import type { readServerEnv } from '../../env/server'
import type { Database } from '../../lib/db/connection'
import { createAuth } from '../../lib/auth/options'
import { user } from './schema'
import { authLockout } from './lockout-schema'
import { evaluateLockout, applyLoginOutcome } from './lockout-policy'
import { LoginInputError, normalizeLoginRequest } from './login-input'
import { authenticationUnavailable, credentialFailure, invalidCredentials } from './login-errors'

export async function handlePasswordLogin(
  database: Database,
  env: ReturnType<typeof readServerEnv>,
  request: Request,
): Promise<Response> {
  try {
    const normalized = await normalizeLoginRequest(request)
    return await database.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
      const [target] = await tx
        .select({ id: user.id, banned: user.banned })
        .from(user)
        .where(eq(user.email, normalized.email))
        .for('update')
      const [stored] = target
        ? await tx.select().from(authLockout).where(eq(authLockout.userId, target.id))
        : []
      const clock = await tx.execute<{ now: string }>(sql`SELECT clock_timestamp() AS now`)
      const now = new Date(clock.rows[0].now)
      const decision = evaluateLockout(stored ?? { failedAttempts: 0, lockedUntil: null }, now)
      const scopedAuth = createAuth(tx, env, {
        beforeCreateSession: async (userId) => {
          if (!target || target.id !== userId || decision.locked)
            throw new APIError('UNAUTHORIZED', {
              code: 'INVALID_EMAIL_OR_PASSWORD',
              message: 'Invalid email or password',
            })
        },
      })
      const response = await scopedAuth.handler(normalized.request)
      if (response.status >= 500) throw new Error('Authentication transaction failed')
      const failure = await credentialFailure(response)
      if (
        target &&
        !target.banned &&
        !decision.locked &&
        (response.status === 200 || failure.invalid)
      ) {
        const state = applyLoginOutcome(
          decision.state,
          response.status === 200 ? 'success' : 'failure',
          now,
        )
        await tx
          .insert(authLockout)
          .values({ userId: target.id, ...state })
          .onConflictDoUpdate({ target: authLockout.userId, set: state })
      }
      return failure.invalid || failure.banned ? invalidCredentials() : response
    })
  } catch (error) {
    if (error instanceof LoginInputError)
      return Response.json(
        { code: 'INVALID_REQUEST', message: 'Invalid login request' },
        { status: error.status },
      )
    console.error('Authentication transaction failed.')
    return authenticationUnavailable()
  }
}
