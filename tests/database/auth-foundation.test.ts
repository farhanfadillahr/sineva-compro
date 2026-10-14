import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { afterAll, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { readTestEnv } from '../../src/env/test'
import { createDatabase } from '../../src/lib/db/connection'
import { user } from '../../src/features/auth/schema'
import { createAuth } from '../../src/lib/auth/options'
import { bootstrapAdmin } from '../../src/features/auth/bootstrap.server'

const env = readTestEnv(process.env)
const connection = createDatabase(env.databaseUrl)
const auth = createAuth(connection.db, env)
const input = {
  name: 'Foundation Test',
  email: `foundation-${randomUUID()}@example.test`,
  password: randomUUID(),
}
let ownUserId: string | undefined
afterAll(async () => {
  if (ownUserId) await connection.db.delete(user).where(eq(user.id, ownUserId))
  await connection.pool.end()
})

it('rolls back the new user when credential creation fails', async () => {
  const failing = { ...input, email: `rollback-${randomUUID()}@example.test` }
  await connection.pool.query(
    `CREATE FUNCTION fixture_reject_credential() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture credential failure'; END $$`,
  )
  await connection.pool.query(
    'CREATE TRIGGER fixture_reject_credential BEFORE INSERT ON account FOR EACH ROW EXECUTE FUNCTION fixture_reject_credential()',
  )
  try {
    await expect(bootstrapAdmin(connection, env, failing)).rejects.toThrow()
    const rows = await connection.pool.query('SELECT id FROM "user" WHERE email = $1', [
      failing.email,
    ])
    expect(rows.rows).toEqual([])
  } finally {
    await connection.pool.query('DROP TRIGGER fixture_reject_credential ON account')
    await connection.pool.query('DROP FUNCTION fixture_reject_credential()')
    await connection.pool.query('DELETE FROM "user" WHERE email = $1', [failing.email])
  }
})

it('serializes two operator bootstraps and creates one credential account', async () => {
  const existing = await connection.db.select({ id: user.id }).from(user).limit(1)
  if (existing.length)
    throw new Error('Bootstrap race test requires an empty test DB; do not remove developer data')
  const results = await Promise.all([
    bootstrapAdmin(connection, env, input),
    bootstrapAdmin(connection, env, input),
  ])
  const created = results.find((r) => r.status === 'created')
  if (created?.status === 'created') ownUserId = created.userId
  expect(results.map((r) => r.status).sort()).toEqual(['already-initialized', 'created'])
  const rows = await connection.pool.query('SELECT count(*)::int AS count FROM "user"')
  expect(rows.rows[0].count).toBe(1)
  const credentials = await connection.pool.query(
    'SELECT count(*)::int AS count FROM account WHERE user_id = $1 AND provider_id = $2',
    [ownUserId, 'credential'],
  )
  expect(credentials.rows[0].count).toBe(1)
})

it('closes public sign-up without creating an account', async () => {
  const response = await auth.handler(
    new Request(`${env.authUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: env.authUrl,
        'x-forwarded-for': '192.0.2.1',
      },
      body: JSON.stringify({ ...input, email: `signup-${randomUUID()}@example.test` }),
    }),
  )
  expect(response.status).toBe(400)
  const rows = await connection.pool.query('SELECT count(*)::int AS count FROM "user"')
  expect(rows.rows[0].count).toBe(1)
})

it('issues a real session and revokes it on logout', async () => {
  const headers = {
    'content-type': 'application/json',
    origin: env.authUrl,
    'x-forwarded-for': '192.0.2.2',
  }
  const login = await auth.handler(
    new Request(`${env.authUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: input.email, password: input.password }),
    }),
  )
  expect(login.status).toBe(200)
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) })
  expect(session?.user.id).toBe(ownUserId)
  expect(session?.user.role).toBe('admin')
  const logout = await auth.handler(
    new Request(`${env.authUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { ...headers, cookie },
      body: '{}',
    }),
  )
  expect(logout.status).toBe(200)
  expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull()
})

it('rejects a forged session token', async () => {
  expect(
    await auth.api.getSession({
      headers: new Headers({ cookie: 'sineva.session_token=forged-token' }),
    }),
  ).toBeNull()
})
