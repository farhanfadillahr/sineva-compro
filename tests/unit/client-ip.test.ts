import { afterEach, expect, it, vi } from 'vitest'
import { getClientIp } from '../../src/lib/http/client-ip'

const cloudflare = { mode: 'cloudflare', originLocked: true } as const
afterEach(() => vi.unstubAllEnvs())

it('ignores all network headers in direct mode', () => {
  expect(
    getClientIp(
      new Headers({
        'CF-Connecting-IP': '192.0.2.1',
        'X-Forwarded-For': '198.51.100.2',
        'X-Real-IP': '203.0.113.3',
        Forwarded: 'for=192.0.2.4',
        'x-sineva-client-ip': '192.0.2.5',
      }),
      { mode: 'direct' },
    ),
  ).toBeNull()
})

it.each([
  ['192.0.2.1', '192.0.2.1'],
  ['2001:DB8:1234:5678::abcd', '2001:0db8:1234:5678:0000:0000:0000:0000'],
  ['2001:0db8:1234:5678:0:0:0:1', '2001:0db8:1234:5678:0000:0000:0000:0000'],
  ['::ffff:192.0.2.1', '192.0.2.1'],
  ['::ffff:c000:201', '192.0.2.1'],
])('uses a single trusted CF IP and canonicalizes %s', (value, expected) => {
  expect(
    getClientIp(
      new Headers({ 'CF-Connecting-IP': value, 'X-Forwarded-For': '203.0.113.1' }),
      cloudflare,
    ),
  ).toBe(expected)
})

it.each([
  undefined,
  '',
  'unknown',
  '192.0.2.1, 192.0.2.2',
  '192.0.2.1, 192.0.2.1',
  '192.0.2.1:443',
  '[2001:db8::1]',
  'fe80::1%eth0',
  '192.0.2.999',
  '192.000.2.1',
  'for=192.0.2.1',
])('returns null for missing or malformed CF IP without falling back to XFF: %s', (value) => {
  const headers = new Headers({
    'X-Forwarded-For': '203.0.113.1',
    'X-Real-IP': '203.0.113.2',
    'CF-Connecting-IPv6': '2001:db8::1',
  })
  if (value !== undefined) headers.set('CF-Connecting-IP', value)
  expect(getClientIp(headers, cloudflare)).toBeNull()
})

it('reads only the validated trust configuration for CPR-49 callers omitting config', () => {
  vi.stubEnv('CLIENT_IP_MODE', 'direct')
  vi.stubEnv('CLOUDFLARE_ORIGIN_LOCKED', 'false')
  const headers = new Headers({ 'CF-Connecting-IP': '192.0.2.1' })
  expect(getClientIp(headers)).toBeNull()
  vi.stubEnv('CLIENT_IP_MODE', 'cloudflare')
  vi.stubEnv('CLOUDFLARE_ORIGIN_LOCKED', 'true')
  expect(getClientIp(headers)).toBe('192.0.2.1')
  vi.stubEnv('CLOUDFLARE_ORIGIN_LOCKED', 'false')
  expect(() => getClientIp(headers)).toThrow(/client IP/i)
})
