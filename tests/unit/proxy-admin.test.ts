import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { decideRoute, isAdminEnabled, proxy } from '../../src/proxy'

describe('isAdminEnabled', () => {
  it('is off in production unless explicitly "true"', () => {
    expect(isAdminEnabled({ NODE_ENV: 'production' })).toBe(false)
    expect(isAdminEnabled({ NODE_ENV: 'production', ADMIN_ENABLED: 'false' })).toBe(false)
    expect(isAdminEnabled({ NODE_ENV: 'production', ADMIN_ENABLED: '1' })).toBe(false)
    expect(isAdminEnabled({ NODE_ENV: 'production', ADMIN_ENABLED: 'TRUE' })).toBe(false)
    expect(isAdminEnabled({ NODE_ENV: 'production', ADMIN_ENABLED: 'true' })).toBe(true)
  })

  it('is on by default outside production, and can be switched off explicitly', () => {
    expect(isAdminEnabled({ NODE_ENV: 'development' })).toBe(true)
    expect(isAdminEnabled({ NODE_ENV: 'test' })).toBe(true)
    expect(isAdminEnabled({})).toBe(true)
    expect(isAdminEnabled({ NODE_ENV: 'development', ADMIN_ENABLED: 'false' })).toBe(false)
  })
})

describe('decideRoute with the admin off', () => {
  it.each([
    '/admin',
    '/admin/',
    '/admin/login',
    '/admin/users/123',
    '/api/auth',
    '/api/auth/get-session',
    '/api/auth/sign-in/email',
    // Next.js decodes the path before routing, so an encoded spelling must not slip past.
    '/%61dmin',
    '/admin/%75sers',
    '/api/%61uth/get-session',
    '/api%2Fauth/get-session',
    // Empty segments collapse to the same route.
    '//admin',
    '/admin//users',
    '/api//auth/get-session',
    // Case-insensitive on purpose: a mixed-case spelling must never reach the admin.
    '/Admin/login',
    '/API/AUTH/get-session',
  ])('answers 404 for %s', (pathname) => {
    expect(decideRoute(pathname, false)).toBe('not-found')
  })

  it.each(['/api/health', '/api/authors', '/api'])('leaves other api path %s alone', (p) => {
    expect(decideRoute(p, false)).toBe('pass')
  })

  it.each(['/', '/services', '/en/services', '/administrator', '/admin-panel', '/authors'])(
    'localizes the public path %s',
    (p) => {
      expect(decideRoute(p, false)).toBe('localize')
    },
  )
})

describe('decideRoute with the admin on', () => {
  it.each(['/admin', '/admin/login', '/api/auth/get-session', '/api/health'])(
    'passes %s through without localizing',
    (p) => {
      expect(decideRoute(p, true)).toBe('pass')
    },
  )

  it.each(['/', '/services', '/en/services'])('still localizes %s', (p) => {
    expect(decideRoute(p, true)).toBe('localize')
  })

  it('tolerates a malformed percent escape without throwing', () => {
    expect(decideRoute('/%E0%A4%A', true)).toBe('localize')
    expect(decideRoute('/admin/%E0%A4%A', false)).toBe('not-found')
  })
})

describe('proxy()', () => {
  const request = (path: string) => new NextRequest(`http://127.0.0.1:3000${path}`)

  it('returns a bare 404 with no body for the admin when the flag is off', async () => {
    // Vitest runs with NODE_ENV=test, so the default is "on": set the flag explicitly.
    process.env.ADMIN_ENABLED = 'false'
    try {
      for (const path of ['/admin', '/admin/login', '/api/auth/get-session']) {
        const response = await proxy(request(path))
        expect(response.status).toBe(404)
        expect(await response.text()).toBe('')
        expect(response.headers.get('content-type') ?? '').not.toMatch(/html/)
      }
    } finally {
      delete process.env.ADMIN_ENABLED
    }
  })

  it('does not rewrite admin or api requests to a localized path when the flag is on', async () => {
    process.env.ADMIN_ENABLED = 'true'
    try {
      for (const path of ['/admin/login', '/api/auth/get-session']) {
        const response = await proxy(request(path))
        expect(response.status).toBe(200)
        expect(response.headers.get('x-middleware-rewrite')).toBeNull()
        expect(response.headers.get('x-middleware-next')).toBe('1')
      }
    } finally {
      delete process.env.ADMIN_ENABLED
    }
  })

  it('still rewrites a public path to the localized tree', async () => {
    const response = await proxy(request('/services'))
    expect(response.headers.get('x-middleware-rewrite')).toContain('/en/services')
  })
})
