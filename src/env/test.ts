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
  return readServerEnv({
    ...input,
    DATABASE_URL: url.href,
    BETTER_AUTH_URL: 'http://127.0.0.1:3001',
  })
}
