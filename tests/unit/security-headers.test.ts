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

  it('allows the media host for images, video loops and the model fetch', () => {
    for (const name of ['img-src', 'media-src', 'connect-src'])
      expect(directive(policy, name)).toContain('https://media.sineva.id')
  })

  // Google Tag Manager (GA4) talks to regional subdomains that Google does not list, so its CSP
  // guide uses these wildcards. They are the only ones allowed, each only where GA4 needs it, and
  // no directive accepts any host (`*`).
  it('allows wildcards only for the Google Analytics hosts that GTM needs', () => {
    const wildcards = policy
      .split('; ')
      .flatMap((part) => {
        const [name, ...sources] = part.split(' ')
        return sources.filter((source) => source.includes('*')).map((source) => `${name} ${source}`)
      })
      .sort()
    expect(wildcards).toEqual([
      'connect-src https://*.google-analytics.com',
      'connect-src https://*.google.com',
      'img-src https://*.google-analytics.com',
    ])
  })

  it('allows Turnstile, Umami, Google Tag Manager, Sentry and the decoder workers', () => {
    expect(directive(policy, 'script-src')).toEqual(
      expect.arrayContaining(['https://challenges.cloudflare.com', 'https://analytics.sineva.id']),
    )
    expect(directive(policy, 'frame-src')).toEqual(
      expect.arrayContaining([
        'https://challenges.cloudflare.com',
        'https://www.googletagmanager.com',
      ]),
    )
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

// Signed draft previews may redirect only to the configured private Blob host.
it('allows the configured Blob host for draft image/video previews, without allowing every Blob store', () => {
  const host = 'https://store.private.blob.vercel-storage.com'
  const policy = buildContentSecurityPolicy({ MEDIA_BLOB_ORIGIN: host })
  for (const name of ['img-src', 'media-src']) expect(directive(policy, name)).toContain(host)
  expect(policy).not.toContain('https://*.blob.vercel-storage.com')
  expect(buildContentSecurityPolicy({ MEDIA_BLOB_ORIGIN: 'not a URL' })).not.toContain('not a URL')
})
