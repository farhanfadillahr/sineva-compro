import { expect, it } from 'vitest'
import { readTestEnv } from '../../src/env/test'

const input = {
  DATABASE_URL: 'postgresql://production@example.com/production',
  TEST_DATABASE_URL: 'postgresql://test@127.0.0.1:5433/sineva_compro_app_test',
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'https://production.example.com',
}
it('uses only the explicit test DB and loopback test origin', () => {
  expect(readTestEnv(input)).toEqual({
    databaseUrl: input.TEST_DATABASE_URL,
    authUrl: 'http://127.0.0.1:3001',
    authSecret: 'a'.repeat(48),
    clientIp: { mode: 'direct' },
  })
})
it.each([
  undefined,
  '',
  'postgresql://test@remote.example.com/sineva_compro_app_test',
  'postgresql://test@127.0.0.1/sineva_compro_app',
  'https://user:secret@127.0.0.1/sineva_compro_app_test',
])(
  'refuses missing/remote/non-test URLs instead of using the developer DB',
  (TEST_DATABASE_URL) => {
    expect(() => readTestEnv({ ...input, TEST_DATABASE_URL })).toThrow(/^TEST_DATABASE_URL /)
  },
)

it('supports an isolated loopback test origin without changing the default', () => {
  expect(readTestEnv({ ...input, TEST_AUTH_URL: 'http://127.0.0.1:3068/' }).authUrl).toBe(
    'http://127.0.0.1:3068',
  )
  expect(readTestEnv({ ...input, TEST_AUTH_URL: 'http://localhost:3068' }).authUrl).toBe(
    'http://localhost:3068',
  )
})

it.each([
  '',
  'https://127.0.0.1:3068',
  'http://example.test:3068',
  'http://127.0.0.1.example.test:3068',
  'http://127.0.0.2:3068',
  'http://user:secret@127.0.0.1:3068',
  'http://127.0.0.1:3068/path',
  'http://127.0.0.1:3068?secret=value',
  'http://127.0.0.1:3068#fragment',
])('rejects an unsafe test HTTP origin: %s', (TEST_AUTH_URL) => {
  expect(() => readTestEnv({ ...input, TEST_AUTH_URL })).toThrow(/^TEST_AUTH_URL /)
})
