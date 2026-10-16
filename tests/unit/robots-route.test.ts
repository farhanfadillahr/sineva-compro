import { afterEach, describe, expect, it, vi } from 'vitest'
import robots from '../../src/app/robots'
import { buildRobotsRules } from '../../src/lib/robots-policy'

const siteUrl = new URL('https://sinevaai.vercel.app')

describe('buildRobotsRules', () => {
  it('blocks every crawler everywhere when the site is not indexable', () => {
    expect(buildRobotsRules({ indexable: false, siteUrl })).toEqual({
      rules: { userAgent: '*', disallow: '/' },
    })
  })

  it('does not advertise a sitemap while the site is hidden', () => {
    // A sitemap line next to "Disallow: /" would send crawlers to URLs they may not fetch.
    expect(buildRobotsRules({ indexable: false, siteUrl })).not.toHaveProperty('sitemap')
  })

  it('allows the site, keeps admin and api out and points at the sitemap when indexable', () => {
    expect(buildRobotsRules({ indexable: true, siteUrl })).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      sitemap: 'https://sinevaai.vercel.app/sitemap.xml',
    })
  })
})

describe('robots.txt route', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('disallows all by default', () => {
    vi.stubEnv('SITE_INDEXABLE', '')
    vi.stubEnv('VERCEL_ENV', '')
    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' })
  })

  it('stays closed on a preview even with the launch flag on', () => {
    vi.stubEnv('SITE_INDEXABLE', 'true')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' })
  })

  it('opens at launch and uses SITE_URL for the sitemap', () => {
    vi.stubEnv('SITE_INDEXABLE', 'true')
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SITE_URL', 'https://sinevaai.vercel.app')
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      sitemap: 'https://sinevaai.vercel.app/sitemap.xml',
    })
  })
})
