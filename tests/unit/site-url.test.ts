import { describe, expect, it } from 'vitest'
import { getSiteUrl } from '../../src/lib/site-url'

describe('getSiteUrl', () => {
  it('prefers an explicit SITE_URL over every Vercel variable', () => {
    const url = getSiteUrl({
      SITE_URL: 'https://sineva.example',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'sineva.vercel.app',
      VERCEL_URL: 'sineva-abc.vercel.app',
    })
    expect(url.href).toBe('https://sineva.example/')
  })

  it('normalizes SITE_URL to its origin and tolerates a trailing slash', () => {
    expect(getSiteUrl({ SITE_URL: 'https://sineva.example/' }).origin).toBe(
      'https://sineva.example',
    )
  })

  it('uses the production domain on a production deployment (host only, https added)', () => {
    const url = getSiteUrl({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'sineva.com',
      VERCEL_URL: 'sineva-abc.vercel.app',
    })
    expect(url.origin).toBe('https://sineva.com')
  })

  it('uses the deployment URL on a preview deployment, not the production domain', () => {
    const url = getSiteUrl({
      VERCEL_ENV: 'preview',
      VERCEL_PROJECT_PRODUCTION_URL: 'sineva.com',
      VERCEL_URL: 'sineva-git-feature-team.vercel.app',
    })
    expect(url.origin).toBe('https://sineva-git-feature-team.vercel.app')
  })

  it('falls back to the deployment URL when production has no production domain variable', () => {
    expect(getSiteUrl({ VERCEL_ENV: 'production', VERCEL_URL: 'x.vercel.app' }).origin).toBe(
      'https://x.vercel.app',
    )
  })

  it('falls back to loopback when nothing is configured', () => {
    expect(getSiteUrl({}).origin).toBe('http://127.0.0.1:3000')
  })

  it('ignores blank values', () => {
    expect(getSiteUrl({ SITE_URL: '  ', VERCEL_URL: '' }).origin).toBe('http://127.0.0.1:3000')
  })

  it.each([
    'sineva.example',
    'ftp://sineva.example',
    'https://user:pass@sineva.example',
    'https://sineva.example/blog',
    'https://sineva.example/?a=1',
    'https://sineva.example/#x',
  ])('rejects the invalid SITE_URL %s instead of silently falling back', (value) => {
    expect(() => getSiteUrl({ SITE_URL: value })).toThrow(/SITE_URL/)
  })
})
