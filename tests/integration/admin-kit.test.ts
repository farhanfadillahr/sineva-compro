import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext } from '../helpers/auth-context'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
let cookie: string, email: string
const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:')
  throw new Error('Admin kit HTTP tests require an isolated loopback server')
beforeAll(async () => {
  ctx = await createAuthTestContext()
  const admin = await ctx.create('admin')
  email = admin.email
  cookie = (await ctx.headersFor(admin)).get('cookie')!
})
afterAll(async () => {
  if (ctx) await ctx.cleanup()
})
it('canonicalizes Users pages beyond the last result while retaining search and page size', async () => {
  const query = new URLSearchParams({ search: email, page: '999', pageSize: '20' })
  const response = await fetch(new URL(`/admin/users?${query}`, base), {
    headers: { cookie },
    redirect: 'manual',
  })
  expect(response.status).toBe(307)
  const location = new URL(response.headers.get('location')!, base)
  expect(location.pathname).toBe('/admin/users')
  expect(location.searchParams.get('search')).toBe(email)
  expect(location.searchParams.get('page')).toBe('1')
  expect(location.searchParams.get('pageSize')).toBe('20')
  const page = await fetch(location, { headers: { cookie } })
  expect(page.status).toBe(200)
  const html = await page.text()
  expect(html).toContain(email)
  expect(html).toContain('Cari pengguna')
})
it('keeps the local component gallery unavailable in a production server', async () => {
  const response = await fetch(new URL('/admin/ui', base), { headers: { cookie } })
  expect(response.status).toBe(404)
  expect(await response.text()).not.toContain('Periksa form')
})
