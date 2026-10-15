import { describe, expect, it } from 'vitest'

const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('HTTP tests require a loopback test server')
}

describe('custom-admin foundation HTTP boundary', () => {
  it('redirects the public entry point to the default localized homepage', async () => {
    const root = await fetch(base, { redirect: 'manual' })
    expect(root.status).toBe(307)
    const target = new URL(root.headers.get('location')!, base)
    expect(target.pathname).toBe('/id')
    const result = await fetch(target, { redirect: 'manual' })
    expect(result.status).toBe(200)
    expect(await result.text()).toContain('Sineva Tech')
  })
  it('redirects anonymous protected admin requests to custom login', async () => {
    const result = await fetch(new URL('/admin', base), { redirect: 'manual' })
    expect(result.status).toBe(307)
    expect(new URL(result.headers.get('location')!, base).pathname).toBe('/admin/login')
  })
  it('does not register the legacy collection CRUD endpoint', async () => {
    const result = await fetch(new URL('/api/users', base))
    expect(result.status).toBe(404)
  })
})
