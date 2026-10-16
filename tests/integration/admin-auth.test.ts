import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'
import { readTestEnv } from '../../src/env/test'
import { createDatabase } from '../../src/lib/db/connection'
import { bootstrapAdmin } from '../../src/features/auth/bootstrap.server'
import { session as authSession, user } from '../../src/features/auth/schema'

const testEnv = readTestEnv(process.env)
const base = new URL(process.env.TEST_BASE_URL ?? testEnv.authUrl)
if (!['127.0.0.1', 'localhost'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('HTTP auth tests require an isolated loopback server and application test DB')
}
const env = readServerEnv({
  ...process.env,
  DATABASE_URL: testEnv.databaseUrl,
  BETTER_AUTH_URL: base.origin,
})
const connection = createDatabase(env.databaseUrl)
const input = {
  name: 'Admin HTTP Test',
  email: `http-${randomUUID()}@example.test`,
  password: randomUUID(),
}
let ownUserId: string | undefined
beforeAll(async () => {
  const result = await bootstrapAdmin(connection, env, input)
  if (result.status !== 'created')
    throw new Error('HTTP auth tests require an empty application test DB')
  ownUserId = result.userId
})
afterAll(async () => {
  if (ownUserId) await connection.db.delete(user).where(eq(user.id, ownUserId))
  await connection.pool.end()
})

const jsonHeaders = { 'content-type': 'application/json', origin: base.origin }
it('blocks public sign-up and operator-only auth APIs through the actual HTTP route', async () => {
  const signup = await fetch(new URL('/api/auth/sign-up/email', base), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ ...input, email: `anonymous-${randomUUID()}@example.test` }),
  })
  expect(signup.status).toBe(400)
  const operator = await fetch(new URL('/api/auth/admin/create-user', base), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(input),
  })
  expect(operator.status).toBe(404)
})

it('renders custom login, serves an authenticated dashboard and refuses a revoked session', async () => {
  const loginPage = await fetch(new URL('/admin/login', base))
  const html = await loginPage.text()
  expect(loginPage.status).toBe(200)
  expect(html).toContain('name="email"')
  expect(html).toContain('name="password"')
  expect(html).toMatch(/name="robots"[^>]*content="noindex, nofollow"/)

  const login = await fetch(new URL('/api/auth/sign-in/email', base), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email: input.email, password: input.password }),
  })
  expect(login.status).toBe(200)
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  expect(cookie).toContain('sineva.session_token=')
  const dashboard = await fetch(new URL('/admin', base), { headers: { cookie } })
  const dashboardHtml = await dashboard.text()
  expect(dashboard.status).toBe(200)
  expect(dashboardHtml).toContain(input.name)
  expect(dashboardHtml).not.toContain(input.email)
  expect(dashboardHtml).not.toContain(input.password)
  const signedInLogin = await fetch(new URL('/admin/login', base), {
    headers: { cookie },
    redirect: 'manual',
  })
  expect(signedInLogin.status).toBe(307)

  const logout = await fetch(new URL('/api/auth/sign-out', base), {
    method: 'POST',
    headers: { ...jsonHeaders, cookie },
    body: '{}',
  })
  expect(logout.status).toBe(200)
  const revoked = await fetch(new URL('/admin', base), { headers: { cookie }, redirect: 'manual' })
  expect(revoked.status).toBe(307)
  expect(new URL(revoked.headers.get('location')!, base).pathname).toBe('/admin/login')
})

it('does not allow a forged session cookie to access the dashboard', async () => {
  const response = await fetch(new URL('/admin', base), {
    headers: { cookie: 'sineva.session_token=forged-cookie' },
    redirect: 'manual',
  })
  expect(response.status).toBe(307)
})

it('refuses an expired database session even when its cookie is valid', async () => {
  const login = await fetch(new URL('/api/auth/sign-in/email', base), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email: input.email, password: input.password }),
  })
  expect(login.status).toBe(200)
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const active = await fetch(new URL('/admin', base), { headers: { cookie } })
  expect(active.status).toBe(200)
  if (!ownUserId) throw new Error('Missing test-owned account')
  await connection.db
    .update(authSession)
    .set({ expiresAt: new Date(Date.now() - 60000) })
    .where(eq(authSession.userId, ownUserId))
  const expiry = await connection.pool.query(
    `SELECT (expires_at AT TIME ZONE 'UTC') < CURRENT_TIMESTAMP AS expired
      FROM session WHERE user_id = $1`,
    [ownUserId],
  )
  expect(expiry.rows.length).toBeGreaterThan(0)
  expect(expiry.rows.every((row: { expired: boolean }) => row.expired)).toBe(true)
  const expired = await fetch(new URL('/admin', base), {
    headers: { cookie },
    redirect: 'manual',
  })
  expect(expired.status).toBe(307)
  expect(new URL(expired.headers.get('location')!, base).pathname).toBe('/admin/login')
})
