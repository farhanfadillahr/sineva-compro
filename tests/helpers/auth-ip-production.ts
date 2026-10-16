// Separate process: Better Auth captures NODE_ENV when its modules load.
import { eq, inArray } from 'drizzle-orm'
import { createAuthTestContext } from './auth-context'
import { createAuth } from '../../src/lib/auth/options'
import { readServerEnv } from '../../src/env/server'
import { rateLimit, session } from '../../src/features/auth/schema'

const mode = process.argv[2]
if (!['direct', 'cloudflare', 'missing'].includes(mode)) throw new Error('Invalid test mode')
const ctx = await createAuthTestContext()
const env = readServerEnv({
  DATABASE_URL: ctx.env.databaseUrl,
  BETTER_AUTH_URL: ctx.env.authUrl,
  BETTER_AUTH_SECRET: ctx.env.authSecret,
  CLIENT_IP_MODE: mode === 'direct' ? 'direct' : 'cloudflare',
  CLOUDFLARE_ORIGIN_LOCKED: mode === 'direct' ? 'false' : 'true',
})
const rollback = Symbol('fixture rollback')
let result: unknown
try {
  const identity = await ctx.create('editor')
  try {
    await ctx.connection.db.transaction(async (tx) => {
      const keys = [
        'no-trusted-ip|/sign-in/email',
        '198.51.100.68|/sign-in/email',
        '198.51.100.69|/sign-in/email',
      ]
      await tx.delete(rateLimit).where(inArray(rateLimit.key, keys))
      const auth = createAuth(tx, env)
      const statuses: number[] = []
      for (let attempt = 0; attempt < (mode === 'cloudflare' ? 7 : 6); attempt++) {
        const request = ctx.request(identity.email, identity.password)
        request.headers.set('x-forwarded-for', `192.0.2.${attempt + 1}`)
        request.headers.set('x-sineva-client-ip', `203.0.113.${attempt + 1}`)
        if (mode === 'cloudflare')
          request.headers.set('cf-connecting-ip', attempt === 6 ? '198.51.100.69' : '198.51.100.68')
        else if (mode === 'direct')
          request.headers.set('cf-connecting-ip', `198.51.100.${attempt + 1}`)
        else {
          request.headers.delete('cf-connecting-ip')
          const invalid = [
            undefined,
            'invalid',
            '192.0.2.1, 192.0.2.2',
            '',
            'fe80::1%eth0',
            undefined,
          ]
          if (invalid[attempt] !== undefined)
            request.headers.set('cf-connecting-ip', invalid[attempt]!)
        }
        statuses.push((await (attempt % 2 ? auth.handler(request) : auth.fetch(request))).status)
      }
      result = {
        statuses,
        buckets: (
          await tx
            .select({ key: rateLimit.key })
            .from(rateLimit)
            .where(inArray(rateLimit.key, keys))
        )
          .map((row) => row.key)
          .sort(),
        sessionIps: [
          ...new Set(
            (
              await tx
                .select({ ip: session.ipAddress })
                .from(session)
                .where(eq(session.userId, identity.id))
            ).map((row) => row.ip),
          ),
        ].sort(),
      }
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
  process.stdout.write(`${JSON.stringify(result)}\n`)
} finally {
  await ctx.cleanup()
}
