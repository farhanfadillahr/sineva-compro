import { describe, expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'

const input = {
  DATABASE_URL: 'postgresql://test@127.0.0.1/sineva_compro_app_test',
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'http://127.0.0.1:3001',
}

describe('client IP trust configuration', () => {
  it('defaults to direct mode and freezes the trust policy', () => {
    const env = readServerEnv(input)
    expect(env).toMatchObject({ clientIp: { mode: 'direct' } })
    expect(Object.isFrozen(env.clientIp)).toBe(true)
  })

  it('accepts Cloudflare only with explicit origin-lock attestation', () => {
    expect(
      readServerEnv({ ...input, CLIENT_IP_MODE: 'cloudflare', CLOUDFLARE_ORIGIN_LOCKED: 'true' }),
    ).toMatchObject({ clientIp: { mode: 'cloudflare', originLocked: true } })
  })

  it.each([
    { CLIENT_IP_MODE: 'cloudflare' },
    { CLIENT_IP_MODE: 'cloudflare', CLOUDFLARE_ORIGIN_LOCKED: 'false' },
    { CLIENT_IP_MODE: 'cloudflare', CLOUDFLARE_ORIGIN_LOCKED: '1' },
    { CLIENT_IP_MODE: 'cloudflare', CLOUDFLARE_ORIGIN_LOCKED: 'TRUE' },
    { CLIENT_IP_MODE: 'direct', CLOUDFLARE_ORIGIN_LOCKED: 'true' },
    { CLOUDFLARE_ORIGIN_LOCKED: 'true' },
    { CLOUDFLARE_ORIGIN_LOCKED: '' },
    { CLIENT_IP_MODE: '' },
    { CLIENT_IP_MODE: 'Cloudflare' },
    { CLIENT_IP_MODE: 'untrusted-value-with-secret' },
  ])('rejects ambiguous or incomplete trust settings without echoing input: %j', (settings) => {
    expect(() => readServerEnv({ ...input, ...settings })).toThrow(/client IP/i)
    try {
      readServerEnv({ ...input, ...settings })
    } catch (error) {
      expect(String(error)).not.toContain('untrusted-value-with-secret')
    }
  })
})
