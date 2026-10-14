import { describe, expect, it } from 'vitest'

const origin = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001'
const parsed = new URL(origin)
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.protocol !== 'http:') {
  throw new Error('Foundation integration tests may only target a local HTTP server')
}

describe('foundation HTTP behavior', () => {
  it('serves the frontend document', async () => {
    const response = await fetch(new URL('/', origin), { signal: AbortSignal.timeout(15000) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('Sineva Tech')
  })

  it('serves an admin page', async () => {
    const response = await fetch(new URL('/admin', origin), { signal: AbortSignal.timeout(15000) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('does not expose users without authentication', async () => {
    const response = await fetch(new URL('/api/users', origin), {
      signal: AbortSignal.timeout(15000),
    })
    expect([401, 403]).toContain(response.status)
    const body = await response.json()
    expect(body.docs).toBeUndefined()
  })

  it('denies normal user creation without authentication', async () => {
    const response = await fetch(new URL('/api/users', origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'unauthorized-foundation@example.invalid',
        password: 'A-valid-shaped-local-test-password-123',
      }),
      signal: AbortSignal.timeout(15000),
    })
    expect([401, 403]).toContain(response.status)
  })
})
