import { expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'
import { readTestEnv } from '../../src/env/test'
import { createDatabase } from '../../src/lib/db/connection'

const input = {
  DATABASE_URL: 'postgresql://local:fixture@127.0.0.1:5434/sineva_compro_app',
  TEST_DATABASE_URL: 'postgresql://local:fixture@127.0.0.1:5433/sineva_compro_app_test',
  BETTER_AUTH_SECRET: 'synthetic-auth-secret-'.repeat(3),
  BETTER_AUTH_URL: 'http://127.0.0.1:3000',
}

it.each([
  'host=remote.example.test',
  'host=%2Ftmp%2Fpostgres-socket',
  'port=9999',
  'user=override',
  'password=private-fixture-value',
  'sslkey=%2Ftmp%2Ffixture.key',
  'sslmode=verify-full&sslmode=disable',
])('rejects connection query overrides before constructing a driver pool: %s', async (query) => {
  const DATABASE_URL = `${input.DATABASE_URL}?${query}`
  const TEST_DATABASE_URL = `${input.TEST_DATABASE_URL}?${query}`
  expect.soft(() => readServerEnv({ ...input, DATABASE_URL })).toThrow(/^DATABASE_URL /)
  expect.soft(() => readTestEnv({ ...input, TEST_DATABASE_URL })).toThrow(/^TEST_DATABASE_URL /)
  let connection: ReturnType<typeof createDatabase> | undefined
  try {
    expect
      .soft(() => {
        connection = createDatabase(TEST_DATABASE_URL)
      })
      .toThrow(/^DATABASE_URL /)
  } finally {
    await connection?.pool.end()
  }
})

it('accepts explicit certificate-verified TLS without target overrides', () => {
  const DATABASE_URL = `${input.DATABASE_URL}?sslmode=verify-full`
  expect(readServerEnv({ ...input, DATABASE_URL }).databaseUrl).toBe(DATABASE_URL)
})
