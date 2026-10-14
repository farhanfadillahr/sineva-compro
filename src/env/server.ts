import { readDatabaseUrl } from './database-url'

type Input = Record<string, string | undefined>

export function readServerEnv(input: Input): Readonly<{
  databaseUrl: string
  authSecret: string
  authUrl: string
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
  return Object.freeze({ databaseUrl, authSecret, authUrl: authOrigin.origin })
}
