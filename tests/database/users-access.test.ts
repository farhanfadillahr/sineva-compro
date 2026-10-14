import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext, type TestIdentity } from '../helpers/auth-context'
import { loadPrincipal, assertCapability } from '../../src/features/auth/access.server'
import { listUsers, getEditor } from '../../src/features/users/query.server'
import { createEditor, setEditorActive } from '../../src/features/users/service.server'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  admin: TestIdentity,
  editor: TestIdentity,
  ah: Headers,
  eh: Headers
beforeAll(async () => {
  ctx = await createAuthTestContext()
  admin = await ctx.create('admin')
  editor = await ctx.create('editor')
  ah = await ctx.headersFor(admin)
  eh = await ctx.headersFor(editor)
})
afterAll(async () => {
  await ctx.cleanup()
})
it('allows only Admin to query Users and rejects anonymous or Editor mutations', async () => {
  const p = await listUsers(ctx.connection.db, ctx.env, ah, { search: '', page: 1, pageSize: 20 })
  expect(p.users.some((u) => u.id === admin.id)).toBe(true)
  const e = await getEditor(ctx.connection.db, ctx.env, ah, editor.id)
  expect(Object.keys(e).sort()).toEqual(['active', 'email', 'id', 'name', 'role'])
  expect(e.role).toBe('editor')
  for (const h of [eh, new Headers()]) {
    const code = h === eh ? 'FORBIDDEN' : 'UNAUTHORIZED'
    await expect(
      listUsers(ctx.connection.db, ctx.env, h, { search: '', page: 1, pageSize: 20 }),
    ).rejects.toMatchObject({ code })
    await expect(
      createEditor(ctx.connection.db, ctx.env, h, {
        name: 'Bad Actor',
        email: 'blocked@example.test',
        password: 'valid-password-123',
      }),
    ).rejects.toMatchObject({ code })
  }
  await expect(getEditor(ctx.connection.db, ctx.env, ah, admin.id)).rejects.toMatchObject({
    code: 'FORBIDDEN',
  })
  await expect(
    setEditorActive(ctx.connection.db, ctx.env, ah, { userId: admin.id, active: false }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  await expect(
    createEditor(ctx.connection.db, ctx.env, ah, {
      name: 'Role Attack',
      email: 'role@example.test',
      password: 'valid-password-123',
      role: 'admin',
    }),
  ).rejects.toMatchObject({ code: 'VALIDATION' })
})
it('uses current role and active status and rejects future sensitive capabilities for Editor', async () => {
  const p = await loadPrincipal(ctx.connection.db, ctx.env, eh)
  expect(p?.role).toBe('editor')
  for (const cap of ['users:manage', 'leads:manage', 'waitlist:export'] as const)
    expect(() => assertCapability(p, cap)).toThrow()
  expect(assertCapability(p, 'content:write').id).toBe(editor.id)
  await ctx.connection.pool.query('UPDATE "user" SET role=$1 WHERE id=$2', ['editor', admin.id])
  await expect(
    listUsers(ctx.connection.db, ctx.env, ah, { search: '', page: 1, pageSize: 20 }),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  await ctx.connection.pool.query('UPDATE "user" SET role=$1 WHERE id=$2', ['admin', admin.id])
  await ctx.connection.pool.query('UPDATE "user" SET banned=true WHERE id=$1', [editor.id])
  expect(await loadPrincipal(ctx.connection.db, ctx.env, eh)).toBeNull()
  await ctx.connection.pool.query('UPDATE "user" SET banned=false,role=$1 WHERE id=$2', [
    'unknown',
    editor.id,
  ])
  expect(await loadPrincipal(ctx.connection.db, ctx.env, eh)).toBeNull()
})
it('treats search wildcards literally and keeps pagination stable without secret fields', async () => {
  await ctx.create('editor')
  const p = await listUsers(ctx.connection.db, ctx.env, ah, { search: '%', page: 1, pageSize: 20 })
  expect(p.total).toBe(0)
  const a = await listUsers(ctx.connection.db, ctx.env, ah, {
    search: 'access-',
    page: 1,
    pageSize: 1,
  })
  const b = await listUsers(ctx.connection.db, ctx.env, ah, {
    search: 'access-',
    page: 2,
    pageSize: 1,
  })
  expect(a.users[0].id).not.toBe(b.users[0].id)
  expect(a.total).toBe(b.total)
})
it('refuses revoked and expired real sessions', async () => {
  const e = await ctx.create('editor')
  const headers = await ctx.headersFor(e)
  await ctx.connection.pool.query(
    "UPDATE session SET expires_at=now()-interval '1 hour' WHERE user_id=$1",
    [e.id],
  )
  expect(await loadPrincipal(ctx.connection.db, ctx.env, headers)).toBeNull()
  const active = await ctx.headersFor(e)
  await ctx.connection.pool.query('DELETE FROM session WHERE user_id=$1', [e.id])
  expect(await loadPrincipal(ctx.connection.db, ctx.env, active)).toBeNull()
})
