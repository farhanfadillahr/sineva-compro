import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { readTestEnv } from '../../src/env/test'
import { readServerEnv } from '../../src/env/server'
import { createDatabase } from '../../src/lib/db/connection'
import { createAuth } from '../../src/lib/auth/options'
import { user } from '../../src/features/auth/schema'

export type TestIdentity = { id: string; name: string; email: string; password: string }
export async function createAuthTestContext() {
  const testEnv = readTestEnv(process.env)
  // In-process fixtures simulate an already secured Cloudflare ingress. Each
  // test gets an independent address; public header trust is tested separately.
  const env = readServerEnv({
    DATABASE_URL: testEnv.databaseUrl,
    BETTER_AUTH_URL: testEnv.authUrl,
    BETTER_AUTH_SECRET: testEnv.authSecret,
    CLIENT_IP_MODE: 'cloudflare',
    CLOUDFLARE_ORIGIN_LOCKED: 'true',
  })
  const connection = createDatabase(env.databaseUrl)
  const auth = createAuth(connection.db, env)
  const ownedIds: string[] = []
  const ip = () =>
    ['2001', 'db8', ...randomUUID().replaceAll('-', '').match(/.{4}/g)!.slice(0, 6)].join(':')
  const request = (email: string, password: string, address = ip()) =>
    new Request(`${env.authUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        origin: env.authUrl,
        'content-type': 'application/json',
        'cf-connecting-ip': address,
      },
      body: JSON.stringify({ email, password }),
    })
  return {
    env,
    connection,
    auth,
    ip,
    request,
    track(id: string) {
      ownedIds.push(id)
    },
    async create(role: 'admin' | 'editor'): Promise<TestIdentity> {
      const input = {
        name: 'Access Test',
        email: `access-${randomUUID()}@example.test`,
        password: randomUUID(),
      }
      const created = await auth.api.createUser({ body: { ...input, role } })
      ownedIds.push(created.user.id)
      return { id: created.user.id, ...input }
    },
    async headersFor(identity: TestIdentity): Promise<Headers> {
      const response = await auth.handler(request(identity.email, identity.password))
      if (response.status !== 200) throw new Error('Fixture sign-in failed')
      const cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ')
      return new Headers({ cookie, origin: env.authUrl })
    },
    async cleanup() {
      try {
        if (ownedIds.length) await connection.db.delete(user).where(inArray(user.id, ownedIds))
      } finally {
        await connection.pool.end()
      }
    },
  }
}
