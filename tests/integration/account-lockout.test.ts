import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext } from '../helpers/auth-context'
import { readTestEnv } from '../../src/env/test'
const trustedIngress = readTestEnv(process.env).clientIp.mode === 'cloudflare'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:')
  throw new Error('Loopback test server required')
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  await ctx.cleanup()
})
const login = (email: string, password: string) =>
  fetch(new URL('/api/auth/sign-in/email', base), {
    method: 'POST',
    headers: {
      origin: base.origin,
      'content-type': 'application/json',
      'x-forwarded-for': ctx.ip(),
      'cf-connecting-ip': ctx.ip(),
    },
    body: JSON.stringify({ email, password }),
  })
it.runIf(trustedIngress)(
  'enforces account lockout through the actual production HTTP route across IPs',
  async () => {
    const e = await ctx.create('editor')
    for (let i = 0; i < 5; i++) expect((await login(e.email, 'wrong-password')).status).toBe(401)
    const locked = await login(e.email, e.password)
    expect(locked.status).toBe(401)
    expect(locked.headers.getSetCookie()).toEqual([])
    expect(await locked.json()).toEqual({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
    })
    expect(
      (
        await ctx.connection.pool.query(
          'SELECT count(*)::int AS count FROM session WHERE user_id=$1',
          [e.id],
        )
      ).rows[0].count,
    ).toBe(0)
    await ctx.connection.pool.query(
      "UPDATE auth_lockout SET locked_until=clock_timestamp()-interval '1 second' WHERE user_id=$1",
      [e.id],
    )
    expect((await login(e.email, e.password)).status).toBe(200)
  },
)
it('rejects invalid HTTP bodies without incrementing account failures', async () => {
  const e = await ctx.create('editor')
  for (const body of [
    '{',
    JSON.stringify({ email: e.email, password: e.password, role: 'admin' }),
    'x'.repeat(9000),
  ]) {
    const r = await fetch(new URL('/api/auth/sign-in/email', base), {
      method: 'POST',
      headers: { origin: base.origin, 'content-type': 'application/json' },
      body,
    })
    expect([400, 413]).toContain(r.status)
    expect(r.headers.getSetCookie()).toEqual([])
  }
  expect(
    (await ctx.connection.pool.query('SELECT user_id FROM auth_lockout WHERE user_id=$1', [e.id]))
      .rows,
  ).toEqual([])
})
