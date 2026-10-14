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
