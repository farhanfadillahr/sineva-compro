import { readServerEnv } from './server'
import { readDatabaseUrl } from './database-url'

export function readTestEnv(input: Record<string, string | undefined>) {
  const url = readDatabaseUrl(input.TEST_DATABASE_URL, 'TEST_DATABASE_URL')
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/sineva_compro_app_test'
  ) {
    throw new Error('TEST_DATABASE_URL must reference the loopback application test database')
  }
  let authOrigin: URL
  try {
    authOrigin = new URL(input.TEST_AUTH_URL ?? 'http://127.0.0.1:3001')
  } catch {
    throw new Error('TEST_AUTH_URL must be a loopback HTTP origin')
  }
  if (
    authOrigin.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(authOrigin.hostname) ||
    authOrigin.username ||
    authOrigin.password ||
    authOrigin.pathname !== '/' ||
    authOrigin.search ||
    authOrigin.hash
  ) {
    throw new Error('TEST_AUTH_URL must be a loopback HTTP origin without credentials or a path')
  }
  return readServerEnv({
    ...input,
    DATABASE_URL: url.href,
    BETTER_AUTH_URL: authOrigin.origin,
  })
}
