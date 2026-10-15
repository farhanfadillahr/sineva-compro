import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createAuthTestContext, type TestIdentity } from '../helpers/auth-context'
import {
  createEditor,
  updateEditor,
  setEditorActive,
  changeEditorPassword,
} from '../../src/features/users/service.server'
import { handlePasswordLogin } from '../../src/features/auth/login-handler.server'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>, admin: TestIdentity, headers: Headers
beforeAll(async () => {
  ctx = await createAuthTestContext()
  admin = await ctx.create('admin')
  headers = await ctx.headersFor(admin)
})
afterAll(async () => {
  await ctx.cleanup()
})
const login = (e: TestIdentity, p = e.password) =>
  handlePasswordLogin(ctx.connection.db, ctx.env, ctx.request(e.email, p))
it('creates one credential Editor under a duplicate-email race', async () => {
  const input = {
    name: 'New Editor',
    email: `race-${randomUUID()}@example.test`,
    password: randomUUID(),
  }
  const results = await Promise.allSettled([
    createEditor(ctx.connection.db, ctx.env, headers, input),
    createEditor(ctx.connection.db, ctx.env, headers, input),
  ])
  for (const r of results) if (r.status === 'fulfilled') ctx.track(r.value.id)
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
  expect(results.find((r) => r.status === 'rejected')).toMatchObject({
    reason: { code: 'CONFLICT' },
  })
  const rows = await ctx.connection.pool.query(
    'SELECT u.id,a.provider_id FROM "user" u JOIN account a ON a.user_id=u.id WHERE u.email=$1',
    [input.email],
  )
  expect(rows.rows).toHaveLength(1)
  expect(rows.rows[0].provider_id).toBe('credential')
})
it('updates identity, revokes sessions on email change and refuses old email', async () => {
  const e = await ctx.create('editor')
  const oldHeaders = await ctx.headersFor(e)
  const changed = await updateEditor(ctx.connection.db, ctx.env, headers, {
    userId: e.id,
    name: 'Renamed Editor',
    email: `renamed-${randomUUID()}@example.test`,
  })
  expect(changed.name).toBe('Renamed Editor')
  expect(await ctx.auth.api.getSession({ headers: oldHeaders })).toBeNull()
  expect((await login(e)).status).toBe(401)
  expect((await login({ ...e, email: changed.email })).status).toBe(200)
})
it('disables and restores an Editor without reviving old sessions', async () => {
  const e = await ctx.create('editor')
  const old = await ctx.headersFor(e)
  await Promise.all([
    setEditorActive(ctx.connection.db, ctx.env, headers, { userId: e.id, active: false }),
    login(e),
  ])
  expect(await ctx.auth.api.getSession({ headers: old })).toBeNull()
  expect((await login(e)).status).toBe(401)
  expect(
    (await ctx.connection.pool.query('SELECT id FROM session WHERE user_id=$1', [e.id])).rows,
  ).toEqual([])
  await setEditorActive(ctx.connection.db, ctx.env, headers, { userId: e.id, active: true })
  expect(await ctx.auth.api.getSession({ headers: old })).toBeNull()
  expect((await login(e)).status).toBe(200)
})
it('changes password and revokes sessions even when old-password login races', async () => {
  const e = await ctx.create('editor')
  const old = await ctx.headersFor(e)
  const pw = randomUUID()
  await Promise.all([
    changeEditorPassword(ctx.connection.db, ctx.env, headers, { userId: e.id, newPassword: pw }),
    login(e),
  ])
  expect(await ctx.auth.api.getSession({ headers: old })).toBeNull()
  expect((await login(e)).status).toBe(401)
  expect(
    (await ctx.connection.pool.query('SELECT id FROM session WHERE user_id=$1', [e.id])).rows,
  ).toEqual([])
  expect((await login(e, pw)).status).toBe(200)
})
it('rolls back password and preserves the old session if revocation fails, without logging secrets', async () => {
  const e = await ctx.create('editor')
  const old = await ctx.headersFor(e)
  const pw = randomUUID()
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {})
  await ctx.connection.pool.query(
    `CREATE FUNCTION fixture_users_reject_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture revocation failure'; END $$`,
  )
  await ctx.connection.pool.query(
    'CREATE TRIGGER fixture_users_reject_delete BEFORE DELETE ON session FOR EACH ROW EXECUTE FUNCTION fixture_users_reject_delete()',
  )
  try {
    await expect(
      changeEditorPassword(ctx.connection.db, ctx.env, headers, { userId: e.id, newPassword: pw }),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' })
    expect(await ctx.auth.api.getSession({ headers: old })).not.toBeNull()
    expect((await login(e)).status).toBe(200)
    expect((await login(e, pw)).status).toBe(401)
    const log = JSON.stringify([...errors.mock.calls, ...warnings.mock.calls])
    for (const secret of [e.password, pw, old.get('cookie')!]) expect(log).not.toContain(secret)
  } finally {
    await ctx.connection.pool.query('DROP TRIGGER fixture_users_reject_delete ON session')
    await ctx.connection.pool.query('DROP FUNCTION fixture_users_reject_delete()')
    errors.mockRestore()
    warnings.mockRestore()
  }
})
it('rolls back user when credential insert fails', async () => {
  const input = {
    name: 'Rollback Editor',
    email: `rollback-${randomUUID()}@example.test`,
    password: randomUUID(),
  }
  await ctx.connection.pool.query(
    `CREATE FUNCTION fixture_users_reject_account() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture credential failure'; END $$`,
  )
  await ctx.connection.pool.query(
    'CREATE TRIGGER fixture_users_reject_account BEFORE INSERT ON account FOR EACH ROW EXECUTE FUNCTION fixture_users_reject_account()',
  )
  try {
    await expect(createEditor(ctx.connection.db, ctx.env, headers, input)).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    })
    expect(
      (await ctx.connection.pool.query('SELECT id FROM "user" WHERE email=$1', [input.email])).rows,
    ).toEqual([])
  } finally {
    await ctx.connection.pool.query('DROP TRIGGER fixture_users_reject_account ON account')
    await ctx.connection.pool.query('DROP FUNCTION fixture_users_reject_account()')
  }
})
