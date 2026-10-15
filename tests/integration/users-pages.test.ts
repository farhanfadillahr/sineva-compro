import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext, type TestIdentity } from '../helpers/auth-context'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  admin: TestIdentity,
  editor: TestIdentity,
  ac: string,
  ec: string
const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:')
  throw new Error('Loopback test server required')
const login = async (e: TestIdentity) => {
  const r = await fetch(new URL('/api/auth/sign-in/email', base), {
    method: 'POST',
    headers: {
      origin: base.origin,
      'content-type': 'application/json',
      'x-forwarded-for': ctx.ip(),
    },
    body: JSON.stringify({ email: e.email, password: e.password }),
  })
  expect(r.status).toBe(200)
  return r.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')
}
beforeAll(async () => {
  ctx = await createAuthTestContext()
  admin = await ctx.create('admin')
  editor = await ctx.create('editor')
  ac = await login(admin)
  ec = await login(editor)
})
afterAll(async () => {
  await ctx.cleanup()
})
it('gives Admin Users list and Editor forms with no credential secrets', async () => {
  for (const [path, expected] of [
    ['/admin/users', 'Tambah Editor'],
    ['/admin/users/new', 'name="password"'],
    [`/admin/users/${editor.id}`, 'name="newPassword"'],
  ]) {
    const r = await fetch(new URL(path, base), { headers: { cookie: ac } })
    const html = await r.text()
    expect(r.status).toBe(200)
    expect(html).toContain(expected)
    expect(html).toMatch(/name="robots"[^>]*content="noindex, nofollow"/)
    for (const secret of [admin.password, editor.password, ac, ec])
      expect(html).not.toContain(secret)
  }
})
it('denies anonymous pages and withholds Users forms and data from Editor even with direct routes', async () => {
  for (const path of ['/admin/users', '/admin/users/new', `/admin/users/${editor.id}`]) {
    const anonymous = await fetch(new URL(path, base), { redirect: 'manual' })
    expect(anonymous.status).toBe(307)
    const forbidden = await fetch(new URL(path, base), { headers: { cookie: ec } })
    const html = await forbidden.text()
    expect([200, 404]).toContain(forbidden.status)
    expect(html).not.toContain('name="newPassword"')
    expect(html).not.toContain('name="password"')
    expect(html).not.toContain('href="/admin/users/new"')
    expect(html).not.toContain('name="email"')
    expect(html).not.toContain('\\"name\\":\\"newPassword\\"')
    expect(html).not.toContain(admin.email)
  }
  const dashboard = await fetch(new URL('/admin', base), { headers: { cookie: ec } })
  expect(await dashboard.text()).not.toContain('href="/admin/users"')
})
