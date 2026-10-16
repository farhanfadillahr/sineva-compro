import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const execute = promisify(execFile)

it.each(['direct', 'missing'])(
  'uses the production no-trusted-ip bucket for %s ingress',
  async (mode) => {
    const { stdout, stderr } = await execute(
      process.execPath,
      ['--import', 'tsx', 'tests/helpers/auth-ip-production.ts', mode],
      {
        env: { ...process.env, NODE_ENV: 'production', TEST: 'false' },
        timeout: 15000,
      },
    )
    expect(JSON.parse(stdout)).toEqual({
      statuses: [200, 200, 200, 200, 200, 429],
      buckets: ['no-trusted-ip|/sign-in/email'],
      sessionIps: [''],
    })
    expect(stderr.trim()).toBe('Authentication warning.')
  },
)

it('uses separate CF buckets and emits no missing-IP warning in production mode', async () => {
  const { stdout, stderr } = await execute(
    process.execPath,
    ['--import', 'tsx', 'tests/helpers/auth-ip-production.ts', 'cloudflare'],
    {
      env: { ...process.env, NODE_ENV: 'production', TEST: 'false' },
      timeout: 15000,
    },
  )
  expect(JSON.parse(stdout)).toEqual({
    statuses: [200, 200, 200, 200, 200, 429, 200],
    buckets: ['198.51.100.68|/sign-in/email', '198.51.100.69|/sign-in/email'],
    sessionIps: ['198.51.100.68', '198.51.100.69'],
  })
  expect(stderr).toBe('')
})
