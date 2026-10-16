import { readDatabaseUrl } from './database-url'

type Input = Record<string, string | undefined>

export type ClientIpConfig = Readonly<
  { mode: 'direct' } | { mode: 'cloudflare'; originLocked: true }
>

export function readClientIpConfig(input: Input): ClientIpConfig {
  const mode = input.CLIENT_IP_MODE ?? 'direct'
  const locked = input.CLOUDFLARE_ORIGIN_LOCKED
  if (mode === 'direct' && (locked === undefined || locked === 'false'))
    return Object.freeze({ mode })
  if (mode === 'cloudflare' && locked === 'true') return Object.freeze({ mode, originLocked: true })
  throw new Error(
    'Invalid client IP configuration: use CLIENT_IP_MODE=direct, or cloudflare with CLOUDFLARE_ORIGIN_LOCKED=true only after securing the origin',
  )
}

export function readServerEnv(input: Input): Readonly<{
  databaseUrl: string
  authSecret: string
  authUrl: string
  clientIp: ClientIpConfig
}> {
  const databaseUrl = readDatabaseUrl(input.DATABASE_URL).href

  const authSecret = input.BETTER_AUTH_SECRET
  if (!authSecret || authSecret.trim().length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 nonblank characters')
  }
  let authOrigin: URL
  try {
    authOrigin = new URL(input.BETTER_AUTH_URL ?? '')
  } catch {
    throw new Error('BETTER_AUTH_URL must be an HTTP(S) origin')
  }
  if (
    !['http:', 'https:'].includes(authOrigin.protocol) ||
    authOrigin.username ||
    authOrigin.password ||
    authOrigin.pathname !== '/' ||
    authOrigin.search ||
    authOrigin.hash
  ) {
    throw new Error('BETTER_AUTH_URL must be an HTTP(S) origin without credentials or a path')
  }
  return Object.freeze({
    databaseUrl,
    authSecret,
    authUrl: authOrigin.origin,
    clientIp: readClientIpConfig(input),
  })
}
