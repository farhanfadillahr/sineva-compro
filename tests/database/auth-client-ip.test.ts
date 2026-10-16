import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { readServerEnv } from '../../src/env/server'
import { createAuth } from '../../src/lib/auth/options'
import { handlePasswordLogin } from '../../src/features/auth/login-handler.server'
import { createAuthTestContext } from '../helpers/auth-context'
import { rateLimit } from '../../src/features/auth/schema'
import type { DatabaseTransaction } from '../../src/lib/db/connection'

let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  await ctx.cleanup()
})

function config(mode: 'direct' | 'cloudflare') {
  return readServerEnv({
    DATABASE_URL: ctx.env.databaseUrl,
    BETTER_AUTH_URL: ctx.env.authUrl,
    BETTER_AUTH_SECRET: ctx.env.authSecret,
    CLIENT_IP_MODE: mode,
    CLOUDFLARE_ORIGIN_LOCKED: mode === 'cloudflare' ? 'true' : 'false',
  })
}

async function rolledBack(run: (tx: DatabaseTransaction) => Promise<void>) {
  const rollback = Symbol('test-only rollback')
  try {
    await ctx.connection.db.transaction(async (tx) => {
      await run(tx)
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
}

it('does not let rotating forged CF, XFF, or internal headers bypass the direct-mode throttle', async () => {
  const identity = await ctx.create('editor')
  await rolledBack(async (tx) => {
    // The library uses localhost in test/dev. Roll back this fixture's shared
    // bucket reset and all its writes, so reruns cannot interfere with others.
    await tx.delete(rateLimit).where(eq(rateLimit.key, '127.0.0.1|/sign-in/email'))
    const auth = createAuth(tx, config('direct'))
    for (let attempt = 1; attempt <= 6; attempt++) {
      const request = ctx.request(identity.email, identity.password)
      request.headers.set('x-forwarded-for', `192.0.2.${attempt}`)
      request.headers.set('cf-connecting-ip', `198.51.100.${attempt}`)
      request.headers.set('x-sineva-client-ip', `203.0.113.${attempt}`)
      const response = await (attempt % 2 ? auth.handler(request) : auth.fetch(request))
      expect(response.status).toBe(attempt <= 5 ? 200 : 429)
      if (attempt === 6) {
        expect(response.headers.get('x-retry-after')).toMatch(/^\d+$/)
        expect(response.headers.getSetCookie()).toEqual([])
      }
    }
  })
})

it('shares five sign-ins for one trusted CF IP, rejects its sixth, and allows a different IP', async () => {
  const identity = await ctx.create('editor')
  const env = config('cloudflare')
  const firstIp = ctx.ip()
  const secondIp = ctx.ip()
  const login = (address: string) => {
    // The login wrapper creates a fresh auth instance per request; counters must persist in SQL.
    const request = ctx.request(identity.email, identity.password)
    request.headers.set('cf-connecting-ip', address)
    return handlePasswordLogin(ctx.connection.db, env, request)
  }
  for (let attempt = 0; attempt < 5; attempt++) expect((await login(firstIp)).status).toBe(200)
  const rejected = await login(firstIp)
  expect(rejected.status).toBe(429)
  expect(rejected.headers.getSetCookie()).toEqual([])
  expect((await login(secondIp)).status).toBe(200)
  expect(
    (
      await ctx.connection.pool.query(
        'SELECT failed_attempts, locked_until FROM auth_lockout WHERE user_id=$1',
        [identity.id],
      )
    ).rows,
  ).toEqual([{ failed_attempts: 0, locked_until: null }])
})

it('canonicalizes equivalent IPv6 /64 and IPv4-mapped spellings into shared buckets', async () => {
  const identity = await ctx.create('editor')
  await rolledBack(async (tx) => {
    await tx.delete(rateLimit).where(eq(rateLimit.key, '192.0.2.38|/sign-in/email'))
    const auth = createAuth(tx, config('cloudflare'))
    const prefix = ctx.ip().split(':').slice(0, 4).join(':')
    for (let attempt = 0; attempt < 6; attempt++) {
      const request = ctx.request(identity.email, identity.password)
      request.headers.set('cf-connecting-ip', `${prefix}::${attempt + 1}`)
      expect((await auth.handler(request)).status).toBe(attempt < 5 ? 200 : 429)
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const request = ctx.request(identity.email, identity.password)
      request.headers.set('cf-connecting-ip', attempt % 2 ? '::ffff:c000:226' : '192.0.2.38')
      expect((await auth.handler(request)).status).toBe(attempt < 5 ? 200 : 429)
    }
  })
})

it('accepts framework-proxied Request objects while preserving the sanitized streaming body', async () => {
  const identity = await ctx.create('editor')
  await rolledBack(async (tx) => {
    const request = ctx.request(identity.email, identity.password)
    request.headers.set('cf-connecting-ip', ctx.ip())
    const proxy = new Proxy(request, {
      get(target, property) {
        const value = Reflect.get(target, property, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    expect((await createAuth(tx, config('cloudflare')).handler(proxy)).status).toBe(200)
  })
})
