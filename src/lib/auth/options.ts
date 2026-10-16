import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { admin } from 'better-auth/plugins'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import type { readServerEnv } from '../../env/server'
import type { Database, DatabaseTransaction } from '../db/connection'
import * as schema from '../db/schema'
import { AUTH_CLIENT_IP_HEADER, getClientIp } from '../http/client-ip'

export type AuthPolicy = { beforeCreateSession?: (userId: string) => Promise<void> }

export function createAuth(
  database: Database | DatabaseTransaction,
  env: ReturnType<typeof readServerEnv>,
  policy?: AuthPolicy,
) {
  const auth = betterAuth({
    appName: 'Sineva Tech',
    databaseHooks: policy?.beforeCreateSession
      ? {
          session: {
            create: {
              before: async (session) => {
                await policy.beforeCreateSession!(session.userId)
              },
            },
          },
        }
      : undefined,
    baseURL: env.authUrl,
    secret: env.authSecret,
    trustedOrigins: [env.authUrl],
    logger: {
      level: 'warn',
      // Library/adapter errors can contain SQL parameters and session tokens.
      // Emit a fixed category rather than serializing messages or nested errors.
      log(level) {
        if (level === 'error') console.error('Authentication operation failed.')
        else if (level === 'warn') console.warn('Authentication warning.')
      },
    },
    database: drizzleAdapter(database, { provider: 'pg', schema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: { expiresIn: 8 * 60 * 60, updateAge: 60 * 60, cookieCache: { enabled: false } },
    advanced: {
      cookiePrefix: 'sineva',
      disableOriginCheck: false,
      disableCSRFCheck: false,
      ipAddress: { ipAddressHeaders: [AUTH_CLIENT_IP_HEADER] },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: { '/sign-in/email': { window: 60, max: 5 } },
    },
    plugins: [
      admin({
        defaultRole: 'editor',
        adminRoles: ['admin'],
        roles: { admin: adminAc, editor: userAc },
      }),
    ],
  })
  // Better Auth's onRequest plugin hooks run AFTER rate limiting in 1.7.7.
  // Sanitize before entering its handler, including its equivalent fetch alias.
  const handler = (request: Request) => {
    const headers = new Headers(request.headers)
    headers.delete(AUTH_CLIENT_IP_HEADER)
    const ip = getClientIp(request.headers, env.clientIp)
    if (ip) headers.set(AUTH_CLIENT_IP_HEADER, ip)
    return auth.handler(new Request(request, { headers }))
  }
  return { ...auth, handler, fetch: handler }
}
