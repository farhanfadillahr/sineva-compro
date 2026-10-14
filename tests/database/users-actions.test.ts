import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createAuthTestContext, type TestIdentity } from '../helpers/auth-context'
import {
  createEditorAction,
  updateEditorAction,
  setEditorActiveAction,
  changeEditorPasswordAction,
} from '../../src/features/users/actions'
const context = vi.hoisted(() => ({ headers: new Headers(), db: undefined as unknown }))
vi.mock('next/headers', () => ({ headers: async () => context.headers }))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('../../src/lib/db/client.server', () => ({
  get db() {
    return context.db
  },
}))
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  admin: TestIdentity,
  editor: TestIdentity,
  ah: Headers,
  eh: Headers
const initial = { status: 'idle' as const, message: '' }
const form = (data: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(data)) f.append(k, v)
  return f
}
beforeAll(async () => {
  ctx = await createAuthTestContext()
  context.db = ctx.connection.db
  vi.stubEnv('BETTER_AUTH_URL', ctx.env.authUrl)
  admin = await ctx.create('admin')
  editor = await ctx.create('editor')
  ah = await ctx.headersFor(admin)
  eh = await ctx.headersFor(editor)
})
afterAll(async () => {
  await ctx.cleanup()
  vi.unstubAllEnvs()
})
it('rejects all Editor and anonymous action invocations with real sessions and no mutation', async () => {
  for (const h of [eh, new Headers()]) {
    context.headers = h
    const calls = [
      createEditorAction(
        initial,
        form({
          name: 'Blocked',
          email: `blocked-${randomUUID()}@example.test`,
          password: randomUUID(),
        }),
      ),
      updateEditorAction(
        initial,
        form({ userId: editor.id, name: 'Blocked', email: editor.email }),
      ),
      setEditorActiveAction(initial, form({ userId: editor.id, active: 'false' })),
      changeEditorPasswordAction(initial, form({ userId: editor.id, newPassword: randomUUID() })),
    ]
    for (const result of await Promise.all(calls)) expect(result.status).toBe('error')
  }
  expect(
    (await ctx.connection.pool.query('SELECT name,banned FROM "user" WHERE id=$1', [editor.id]))
      .rows,
  ).toEqual([{ name: 'Access Test', banned: false }])
})
it('rejects role spoofing duplicate fields File values and targeting Admin', async () => {
  context.headers = ah
  const valid = {
    name: 'Spoof Test',
    email: `spoof-${randomUUID()}@example.test`,
    password: randomUUID(),
  }
  const duplicate = form(valid)
  duplicate.append('email', 'other@example.test')
  const file = form(valid)
  file.set('name', new Blob(['not text']), 'name.txt')
  for (const f of [form({ ...valid, role: 'admin' }), duplicate, file])
    expect((await createEditorAction(initial, f)).status).toBe('error')
  expect(
    (await setEditorActiveAction(initial, form({ userId: admin.id, active: 'false' }))).status,
  ).toBe('error')
  expect(
    (await ctx.connection.pool.query('SELECT id FROM "user" WHERE email=$1', [valid.email])).rows,
  ).toEqual([])
})
it('creates and changes an Editor through thin actions without returning credentials', async () => {
  context.headers = ah
  const input = {
    name: 'Action Editor',
    email: `action-${randomUUID()}@example.test`,
    password: randomUUID(),
  }
  const f = form(input)
  f.append('$ACTION_ID_fixture', 'ignored')
  const created = await createEditorAction(initial, f)
  if (created.userId) ctx.track(created.userId)
  expect(created.status).toBe('success')
  expect(JSON.stringify(created)).not.toContain(input.password)
  const id = created.userId!
  expect(
    (
      await updateEditorAction(
        initial,
        form({ userId: id, name: 'Updated Action', email: input.email }),
      )
    ).status,
  ).toBe('success')
  expect((await setEditorActiveAction(initial, form({ userId: id, active: 'false' }))).status).toBe(
    'success',
  )
  expect((await setEditorActiveAction(initial, form({ userId: id, active: 'true' }))).status).toBe(
    'success',
  )
  const newPassword = randomUUID()
  const changed = await changeEditorPasswordAction(initial, form({ userId: id, newPassword }))
  expect(changed.status).toBe('success')
  expect(JSON.stringify(changed)).not.toContain(newPassword)
})
