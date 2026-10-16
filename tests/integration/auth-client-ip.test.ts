import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { readTestEnv } from '../../src/env/test'
import { createDatabase } from '../../src/lib/db/connection'
import { createAuth } from '../../src/lib/auth/options'
import { user } from '../../src/features/auth/schema'

const env = readTestEnv(process.env)
const connection = createDatabase(env.databaseUrl)
const identity = {
  name: 'IP HTTP Test',
  email: `ip-${randomUUID()}@example.test`,
  password: randomUUID(),
}
let ownUserId: string | undefined
beforeAll(async () => {
  if (env.clientIp.mode === 'cloudflare') {
    const result = await createAuth(connection.db, env).api.createUser({
      body: { ...identity, role: 'editor' },
    })
    ownUserId = result.user.id
  }
})
afterAll(async () => {
  if (ownUserId) await connection.db.delete(user).where(eq(user.id, ownUserId))
  await connection.pool.end()
})

it.runIf(env.clientIp.mode === 'cloudflare')(
  'enforces independent CF buckets through the actual HTTP login route',
  async () => {
    const ip = () =>
      ['2001', 'db8', ...randomUUID().replaceAll('-', '').match(/.{4}/g)!.slice(0, 6)].join(':')
    const first = ip()
    const second = ip()
    const login = (address: string) =>
      fetch(`${env.authUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          origin: env.authUrl,
          'content-type': 'application/json',
          'cf-connecting-ip': address,
          'x-forwarded-for': ip(),
          'x-sineva-client-ip': ip(),
        },
        body: JSON.stringify({ email: identity.email, password: identity.password }),
      })
    for (let attempt = 0; attempt < 5; attempt++) expect((await login(first)).status).toBe(200)
    const denied = await login(first)
    expect(denied.status).toBe(429)
    expect(denied.headers.getSetCookie()).toEqual([])
    expect((await login(second)).status).toBe(200)
  },
)
