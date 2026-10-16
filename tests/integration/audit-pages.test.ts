import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createAuthTestContext } from '../helpers/auth-context'
import { createEditor } from '../../src/features/users/service.server'
import { auditLog } from '../../src/features/audit/schema'

let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
let adminCookie: string, editorCookie: string, actorId: string, entityId: string
const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:')
  throw new Error('Audit HTTP tests require an isolated loopback server')
const privateEmail = `audit-private-${crypto.randomUUID()}@example.test`
const password = crypto.randomUUID()
beforeAll(async () => {
  ctx = await createAuthTestContext()
  const admin = await ctx.create('admin')
  const editor = await ctx.create('editor')
  actorId = admin.id
  const adminHeaders = await ctx.headersFor(admin)
  adminCookie = adminHeaders.get('cookie')!
  editorCookie = (await ctx.headersFor(editor)).get('cookie')!
  const created = await createEditor(ctx.connection.db, ctx.env, adminHeaders, {
    name: 'Audit HTTP fixture',
    email: privateEmail,
    password,
  })
  entityId = created.id
  ctx.track(entityId)
})
afterAll(async () => {
  if (!ctx) return
  try {
    if (actorId) await ctx.connection.db.delete(auditLog).where(eq(auditLog.actorId, actorId))
  } finally {
    await ctx.cleanup()
  }
})
it('renders only audit metadata for Admin and keeps actor/entity filters in pagination redirects', async () => {
  const query = new URLSearchParams({ actor: actorId, entity: 'users' })
  const response = await fetch(new URL(`/admin/audit?${query}`, base), {
    headers: { cookie: adminCookie },
  })
  const html = await response.text()
  expect(response.status).toBe(200)
  expect(html).toContain('Riwayat perubahan admin')
  expect(html).toContain(entityId)
  expect(html).not.toContain(privateEmail)
  expect(html).not.toContain(password)
  expect(html).not.toContain(adminCookie)
  const beyond = await fetch(new URL(`/admin/audit?${query}&page=999`, base), {
    headers: { cookie: adminCookie },
    redirect: 'manual',
  })
  expect(beyond.status).toBe(307)
  const location = new URL(beyond.headers.get('location')!, base)
  expect(location.pathname).toBe('/admin/audit')
  expect(location.searchParams.get('actor')).toBe(actorId)
  expect(location.searchParams.get('entity')).toBe('users')
  expect(location.searchParams.get('page')).toBe('1')
})
it('redirects anonymous readers and withholds audit records from Editor direct requests', async () => {
  const anonymous = await fetch(new URL('/admin/audit', base), { redirect: 'manual' })
  expect(anonymous.status).toBe(307)
  expect(new URL(anonymous.headers.get('location')!, base).pathname).toBe('/admin/login')
  const forbidden = await fetch(new URL('/admin/audit', base), {
    headers: { cookie: editorCookie },
  })
  expect([200, 404]).toContain(forbidden.status)
  const html = await forbidden.text()
  expect(html).not.toContain(entityId)
  expect(html).not.toContain('Riwayat perubahan admin')
})
