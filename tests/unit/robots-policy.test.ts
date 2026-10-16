import { describe, expect, it } from 'vitest'
import { getRobots, isIndexable } from '../../src/lib/robots-policy'

const NOINDEX = { index: false, follow: false }
const INDEX = { index: true, follow: true }

describe('isIndexable', () => {
  it('is off by default, even in production', () => {
    expect(isIndexable({})).toBe(false)
    expect(isIndexable({ VERCEL_ENV: 'production' })).toBe(false)
  })

  it('needs the literal string "true"', () => {
    for (const value of ['1', 'TRUE', 'yes', 'false', '']) {
      expect(isIndexable({ VERCEL_ENV: 'production', SITE_INDEXABLE: value })).toBe(false)
    }
  })

  it('is on for a Vercel production deployment once launched', () => {
    expect(isIndexable({ VERCEL_ENV: 'production', SITE_INDEXABLE: 'true' })).toBe(true)
  })

  it.each(['preview', 'development'])(
    'stays off on a Vercel %s deployment even when the flag is on',
    (VERCEL_ENV) => {
      expect(isIndexable({ VERCEL_ENV, SITE_INDEXABLE: 'true' })).toBe(false)
    },
  )

  it('treats a non-Vercel host (no VERCEL_ENV) as production when the flag is on', () => {
    expect(isIndexable({ SITE_INDEXABLE: 'true' })).toBe(true)
  })
})

describe('getRobots', () => {
  it('returns noindex and nofollow when not indexable', () => {
    expect(getRobots({ VERCEL_ENV: 'preview', SITE_INDEXABLE: 'true' })).toEqual(NOINDEX)
    expect(getRobots({})).toEqual(NOINDEX)
  })

  it('returns index and follow when indexable', () => {
    expect(getRobots({ VERCEL_ENV: 'production', SITE_INDEXABLE: 'true' })).toEqual(INDEX)
  })
})
