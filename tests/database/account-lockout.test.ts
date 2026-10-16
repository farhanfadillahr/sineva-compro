import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext } from '../helpers/auth-context'
import { handlePasswordLogin } from '../../src/features/auth/login-handler.server'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  await ctx.cleanup()
})
const login = (email: string, password: string, ip?: string) =>
  handlePasswordLogin(ctx.connection.db, ctx.env, ctx.request(email, password, ip))
const state = async (id: string) =>
  (
    await ctx.connection.pool.query(
      'SELECT failed_attempts, locked_until > clock_timestamp() AS locked FROM auth_lockout WHERE user_id=$1',
      [id],
    )
  ).rows[0]
const sessions = async (id: string) =>
  (
    await ctx.connection.pool.query('SELECT count(*)::int AS count FROM session WHERE user_id=$1', [
      id,
    ])
  ).rows[0].count
it('locks after five consecutive failures across IPs, does not extend lock, and denies correct password', async () => {
  const editor = await ctx.create('editor')
  for (let i = 0; i < 5; i++) {
    const r = await login(editor.email, 'incorrect-test-password')
    expect(r.status).toBe(401)
    expect(r.headers.getSetCookie()).toEqual([])
  }
  expect(await state(editor.id)).toEqual({ failed_attempts: 5, locked: true })
  const before = (
    await ctx.connection.pool.query('SELECT locked_until FROM auth_lockout WHERE user_id=$1', [
      editor.id,
    ])
  ).rows
  expect((await login(editor.email, editor.password)).status).toBe(401)
  expect(
    (
      await ctx.connection.pool.query('SELECT locked_until FROM auth_lockout WHERE user_id=$1', [
        editor.id,
      ])
    ).rows,
  ).toEqual(before)
  expect(await sessions(editor.id)).toBe(0)
})
it('resets on successful login and after expiry without waiting fifteen minutes', async () => {
  const e = await ctx.create('editor')
  await login(e.email, 'bad-password')
  expect((await login(e.email.toUpperCase(), e.password)).status).toBe(200)
  expect(await state(e.id)).toEqual({ failed_attempts: 0, locked: null })
  await ctx.connection.pool.query(
    "UPDATE auth_lockout SET failed_attempts=5, locked_until=clock_timestamp()-interval '1 second' WHERE user_id=$1",
    [e.id],
  )
  expect((await login(e.email, 'wrong')).status).toBe(401)
  expect(await state(e.id)).toEqual({ failed_attempts: 1, locked: null })
  expect((await login(e.email, e.password)).status).toBe(200)
})
it('serializes concurrent failures to exactly five and valid versus fifth failure to a legal serial outcome', async () => {
  const e = await ctx.create('editor')
  expect(
    (await Promise.all(Array.from({ length: 5 }, () => login(e.email, 'wrong')))).map(
      (r) => r.status,
    ),
  ).toEqual([401, 401, 401, 401, 401])
  expect(await state(e.id)).toEqual({ failed_attempts: 5, locked: true })
  const race = await ctx.create('editor')
  for (let i = 0; i < 4; i++) await login(race.email, 'wrong')
  const [good, bad] = await Promise.all([
    login(race.email, race.password),
    login(race.email, 'wrong'),
  ])
  expect(bad.status).toBe(401)
  if (good.status === 200) {
    expect(await state(race.id)).toEqual({ failed_attempts: 1, locked: null })
    expect(await sessions(race.id)).toBe(1)
  } else {
    expect(good.status).toBe(401)
    expect(await state(race.id)).toEqual({ failed_attempts: 5, locked: true })
    expect(await sessions(race.id)).toBe(0)
  }
})
it('returns the same safe failure for unknown, wrong, banned and locked accounts', async () => {
  const e = await ctx.create('editor')
  const banned = await ctx.create('editor')
  const locked = await ctx.create('editor')
  await ctx.connection.pool.query('UPDATE "user" SET banned=true WHERE id=$1', [banned.id])
  for (let i = 0; i < 5; i++) await login(locked.email, 'wrong')
  const unknown = `unknown-${ctx.ip().replaceAll(':', '')}@example.test`
  for (const [email, pw] of [
    [unknown, 'wrong'],
    [e.email, 'wrong'],
    [banned.email, banned.password],
    [locked.email, locked.password],
  ]) {
    const r = await login(email, pw)
    expect(r.status).toBe(401)
    expect(r.headers.getSetCookie()).toEqual([])
    expect(await r.json()).toEqual({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
    })
  }
  expect(
    (await ctx.connection.pool.query('SELECT id FROM "user" WHERE email=$1', [unknown])).rows,
  ).toEqual([])
  expect(await state(banned.id)).toBeUndefined()
})
it('does not count CSRF, untrusted callback, malformed requests or IP limits as credential failures', async () => {
  const e = await ctx.create('editor')
  const origin = ctx.request(e.email, 'wrong')
  origin.headers.set('origin', 'https://evil.example')
  expect((await handlePasswordLogin(ctx.connection.db, ctx.env, origin)).status).toBe(403)
  const callback = new Request(`${ctx.env.authUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      origin: ctx.env.authUrl,
      'content-type': 'application/json',
      'cf-connecting-ip': ctx.ip(),
    },
    body: JSON.stringify({
      email: e.email,
      password: e.password,
      callbackURL: 'https://evil.example',
    }),
  })
  expect((await handlePasswordLogin(ctx.connection.db, ctx.env, callback)).status).toBe(403)
  expect(await state(e.id)).toBeUndefined()
  const ip = ctx.ip()
  for (let i = 0; i < 5; i++) await login(e.email, 'wrong', ip)
  expect((await login(e.email, e.password, ip)).status).toBe(429)
  expect(await state(e.id)).toEqual({ failed_attempts: 5, locked: true })
})
it('fails safely on row-lock timeout and releases the connection for the next request', async () => {
  const e = await ctx.create('editor')
  const client = await ctx.connection.pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [e.id])
    const r = await login(e.email, e.password)
    expect(r.status).toBe(503)
    expect(r.headers.getSetCookie()).toEqual([])
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
  expect((await login(e.email, e.password)).status).toBe(200)
})
it('rolls back counter and session when the library cannot insert a session', async () => {
  const e = await ctx.create('editor')
  await login(e.email, 'wrong')
  await ctx.connection.pool.query(
    `CREATE FUNCTION fixture_login_reject_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture session failure'; END $$`,
  )
  await ctx.connection.pool.query(
    'CREATE TRIGGER fixture_login_reject_session BEFORE INSERT ON session FOR EACH ROW EXECUTE FUNCTION fixture_login_reject_session()',
  )
  try {
    const r = await login(e.email, e.password)
    expect(r.status).toBe(503)
    expect(r.headers.getSetCookie()).toEqual([])
    expect(await sessions(e.id)).toBe(0)
    expect(await state(e.id)).toEqual({ failed_attempts: 1, locked: null })
    expect(await r.json()).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Authentication unavailable',
    })
  } finally {
    await ctx.connection.pool.query('DROP TRIGGER fixture_login_reject_session ON session')
    await ctx.connection.pool.query('DROP FUNCTION fixture_login_reject_session()')
  }
})
