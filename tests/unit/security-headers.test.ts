import { describe, expect, it } from 'vitest'
import { buildContentSecurityPolicy, securityHeaders } from '../../src/lib/security/headers.mjs'

const env = {
  NODE_ENV: 'production',
  MEDIA_PUBLIC_ORIGIN: 'https://media.sineva.id',
  UMAMI_HOST: 'https://analytics.sineva.id',
  SENTRY_INGEST_ORIGIN: 'https://o1.ingest.sentry.io',
}

const directive = (policy: string, name: string) =>
  policy
    .split('; ')
    .find((part) => part.startsWith(`${name} `))
    ?.slice(name.length + 1)
    .split(' ') ?? []

describe('content security policy', () => {
  const policy: string = buildContentSecurityPolicy(env)

  it('never allows eval, only wasm for the decoder', () => {
    expect(policy).not.toContain("'unsafe-eval'")
    expect(directive(policy, 'script-src')).toContain("'wasm-unsafe-eval'")
  })

  it('allows the media host for images, video loops and the model fetch, without wildcards', () => {
    for (const name of ['img-src', 'media-src', 'connect-src'])
      expect(directive(policy, name)).toContain('https://media.sineva.id')
    expect(policy).not.toMatch(/(^|\s)\*(\s|;|$)|https:\/\/\*\./)
  })

  it('allows Turnstile, Umami, Sentry and the decoder workers', () => {
    expect(directive(policy, 'script-src')).toEqual(
      expect.arrayContaining(['https://challenges.cloudflare.com', 'https://analytics.sineva.id']),
    )
    expect(directive(policy, 'frame-src')).toEqual(['https://challenges.cloudflare.com'])
    expect(directive(policy, 'connect-src')).toContain('https://o1.ingest.sentry.io')
    expect(directive(policy, 'worker-src')).toEqual(["'self'", 'blob:'])
    expect(directive(policy, 'frame-ancestors')).toEqual(["'none'"])
  })

  it('skips hosts that are not configured', () => {
    expect(buildContentSecurityPolicy({ NODE_ENV: 'development' })).not.toContain('undefined')
  })
})

describe('security headers', () => {
  const keys = (headers: { key: string }[]) => headers.map((h) => h.key)
  it('reports only by default and enforces with CSP_MODE=enforce', () => {
    expect(keys(securityHeaders({}))).toContain('Content-Security-Policy-Report-Only')
    expect(keys(securityHeaders({ CSP_MODE: 'enforce' }))).toContain('Content-Security-Policy')
    expect(keys(securityHeaders({ CSP_MODE: 'off' }))).not.toEqual(
      expect.arrayContaining(['Content-Security-Policy', 'Content-Security-Policy-Report-Only']),
    )
  })
  it('sends HSTS in production and the baseline headers everywhere', () => {
    expect(keys(securityHeaders({ NODE_ENV: 'production' }))).toContain('Strict-Transport-Security')
    expect(keys(securityHeaders({}))).not.toContain('Strict-Transport-Security')
    expect(keys(securityHeaders({}))).toEqual(
      expect.arrayContaining([
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-Frame-Options',
      ]),
    )
  })
})
