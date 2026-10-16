import { describe, expect, it } from 'vitest'
import { TURNSTILE_TEST_SECRET_PASS, turnstileSecret } from '../../src/features/leads/turnstile'

describe('turnstileSecret', () => {
  it('uses the configured secret', () => {
    expect(turnstileSecret({ TURNSTILE_SECRET_KEY: 'real', NODE_ENV: 'production' })).toBe('real')
  })
  it("uses Cloudflare's test secret outside production", () => {
    expect(turnstileSecret({ NODE_ENV: 'development' })).toBe(TURNSTILE_TEST_SECRET_PASS)
    expect(turnstileSecret({ NODE_ENV: 'test' })).toBe(TURNSTILE_TEST_SECRET_PASS)
  })
  it('fails closed in production without a secret', () => {
    expect(turnstileSecret({ NODE_ENV: 'production' })).toBeNull()
  })
})
