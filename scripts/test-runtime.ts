import 'dotenv/config'
import { spawn } from 'node:child_process'
import { readTestEnv } from '../src/env/test'

const env = readTestEnv(process.env)
const mode = process.argv[2]
let args: string[]
if (mode === 'prepare') args = ['--import', 'tsx', 'scripts/migrate.ts']
else if (mode === 'server')
  args = [
    'node_modules/next/dist/bin/next',
    process.argv.includes('--production') ? 'start' : 'dev',
    '--hostname',
    '127.0.0.1',
    '--port',
    new URL(env.authUrl).port || '80',
  ]
else throw new Error('Test runtime mode must be prepare or server')

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  // ADMIN_ENABLED: production builds default the admin to off (phase 1 static deploy), but the
  // HTTP suite exercises the admin, so the test server always runs with it on.
  env: {
    ...process.env,
    DATABASE_URL: env.databaseUrl,
    BETTER_AUTH_URL: env.authUrl,
    ADMIN_ENABLED: 'true',
  },
})
process.once('SIGINT', () => child.kill('SIGINT'))
process.once('SIGTERM', () => child.kill('SIGTERM'))
child.once('error', () => {
  console.error('Test process failed to start.')
  process.exitCode = 1
})
child.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1)
})
