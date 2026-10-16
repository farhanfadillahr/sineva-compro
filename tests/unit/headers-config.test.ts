import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config.mjs'

type Rule = { source: string; headers: { key: string; value: string }[] }
const rules = (await nextConfig.headers?.()) as Rule[]
const valueFor = (source: string, key: string) =>
  rules.find((r) => r.source === source)?.headers.find((h) => h.key === key)?.value

describe('next.config headers', () => {
  it.each(['/mascot/:path*', '/draco/:path*', '/lottie/:path*', '/og/:path*'])(
    'serves %s as immutable for a year',
    (source) => {
      expect(valueFor(source, 'Cache-Control')).toBe('public, max-age=31536000, immutable')
    },
  )

  it('does not make pages or the brand folder immutable', () => {
    const sources = rules.filter((r) => r.headers.some((h) => h.key === 'Cache-Control'))
    expect(sources.map((r) => r.source).sort()).toEqual([
      '/draco/:path*',
      '/lottie/:path*',
      '/mascot/:path*',
      '/og/:path*',
    ])
  })

  it('sets the baseline security headers on every route', () => {
    expect(valueFor('/:path*', 'X-Content-Type-Options')).toBe('nosniff')
    expect(valueFor('/:path*', 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(valueFor('/:path*', 'Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    )
    expect(valueFor('/:path*', 'X-Frame-Options')).toBe('DENY')
  })

  it('ships the CSP in report-only mode unless CSP_MODE=enforce (CPR-53)', () => {
    const keys = rules.flatMap((r) => r.headers.map((h) => h.key.toLowerCase()))
    const expected =
      process.env.CSP_MODE === 'enforce'
        ? 'content-security-policy'
        : process.env.CSP_MODE === 'off'
          ? null
          : 'content-security-policy-report-only'
    if (expected) expect(keys).toContain(expected)
  })
})
