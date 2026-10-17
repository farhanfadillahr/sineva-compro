import { describe, expect, it } from 'vitest'
import { isCronRequest } from '../../src/lib/http/cron-auth'

const headers = (value?: string) => new Headers(value ? { authorization: value } : {})

describe('cron request check (CPR-111)', () => {
  it('accepts only the exact bearer secret', () => {
    expect(isCronRequest(headers('Bearer s3cret-value'), 's3cret-value')).toBe(true)
    expect(isCronRequest(headers('Bearer wrong'), 's3cret-value')).toBe(false)
    expect(isCronRequest(headers('s3cret-value'), 's3cret-value')).toBe(false)
    expect(isCronRequest(headers(), 's3cret-value')).toBe(false)
  })

  it('refuses everything when no secret is configured', () => {
    expect(isCronRequest(headers('Bearer '), '')).toBe(false)
    expect(isCronRequest(headers('Bearer undefined'), undefined)).toBe(false)
  })
})
