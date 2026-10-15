import { spawn } from 'node:child_process'
import { expect, it } from 'vitest'
import { productionHttpOptions } from '../../scripts/test-http-production'
const input: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://developer@remote.example.com/developer',
  TEST_DATABASE_URL: 'postgresql://fixture@127.0.0.1:5433/sineva_compro_app_test',
  BETTER_AUTH_SECRET: 'test-only-secret-'.repeat(3),
  BETTER_AUTH_URL: 'https://developer.example.com',
  TEST_BASE_URL: 'https://developer.example.com',
}
it('targets the validated test database and origin for both real commands', () => {
  const options = productionHttpOptions(input)
  expect(options.env.DATABASE_URL).toBe(
    'postgresql://fixture@127.0.0.1:5433/sineva_compro_app_test',
  )
  expect(options.env.TEST_DATABASE_URL).toBe(options.env.DATABASE_URL)
  expect(options.env.BETTER_AUTH_URL).toBe('http://127.0.0.1:3001')
  expect(options.env.TEST_BASE_URL).toBe('http://127.0.0.1:3001')
  expect(options.readyUrl.href).toBe('http://127.0.0.1:3001/admin/login')
  expect(options.server.args).toContain('--production')
  expect(options.tests.args).toContain('vitest.integration.config.mts')
})
it.each([
  undefined,
  '',
  'postgresql://fixture@remote.example.com/sineva_compro_app_test',
  'postgresql://fixture@127.0.0.1/sineva_compro_app',
])('refuses invalid test DB instead of developer fallback', (TEST_DATABASE_URL) => {
  expect(() => productionHttpOptions({ ...input, TEST_DATABASE_URL })).toThrow()
})
it('refuses a missing/short auth secret', () => {
  expect(() => productionHttpOptions({ ...input, BETTER_AUTH_SECRET: 'short' })).toThrow()
})
it('CLI returns failure without leaking invalid URL credentials', async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/test-http-production.ts'], {
    env: {
      ...process.env,
      ...input,
      TEST_DATABASE_URL: 'postgresql://private-user:private-password@remote.example.com/production',
    },
  })
  let output = ''
  child.stdout.on('data', (data) => {
    output += data
  })
  child.stderr.on('data', (data) => {
    output += data
  })
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', resolve)
  })
  expect(code).toBe(1)
  expect(output).toContain('Production HTTP verification failed.')
  expect(output).not.toMatch(/private-user|private-password|remote\.example/)
})
