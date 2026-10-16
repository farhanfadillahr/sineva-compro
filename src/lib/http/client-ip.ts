import { isIP } from 'node:net'
import { getIP } from 'better-auth/api'
import { readClientIpConfig, type ClientIpConfig } from '../../env/server'

// This is an internal transport between createAuth's wrapper and Better Auth.
// Always remove inbound values before setting it; it is not a trusted proxy header.
export const AUTH_CLIENT_IP_HEADER = 'x-sineva-client-ip'

/**
 * Trust CF only behind an operator-verified, locked origin. A Web Headers object
 * has no socket peer information and cannot authenticate a sender. Return null
 * for direct mode, missing/invalid CF, or duplicate/chain values; never use XFF.
 * Keep Better Auth 1.7.7's IPv4-mapped normalization and IPv6 /64 bucket policy.
 */
export function getClientIp(
  headers: Pick<Headers, 'get'>,
  config: ClientIpConfig = readClientIpConfig(process.env),
): string | null {
  if (config.mode !== 'cloudflare' || !config.originLocked) return null
  const value = headers.get('cf-connecting-ip')
  if (!value || value.includes('%') || isIP(value) === 0) return null
  return getIP(new Headers({ 'cf-connecting-ip': value }), {
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'], ipv6Subnet: 64 } },
  })
}
