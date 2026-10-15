import 'dotenv/config'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readTestEnv } from '../src/env/test'
import { withTestServer, type TestServerOptions } from './lib/with-test-server'

export function productionHttpOptions(input: NodeJS.ProcessEnv): TestServerOptions {
  const validated = readTestEnv(input)
  return {
    server: {
      file: process.execPath,
      args: ['--import', 'tsx', 'scripts/test-runtime.ts', 'server', '--production'],
    },
    tests: {
      file: process.execPath,
      args: ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.mts'],
    },
    env: {
      ...input,
      DATABASE_URL: validated.databaseUrl,
      TEST_DATABASE_URL: validated.databaseUrl,
      BETTER_AUTH_URL: validated.authUrl,
      TEST_BASE_URL: validated.authUrl,
    },
    readyUrl: new URL('/admin/login', validated.authUrl),
    readinessTimeoutMs: 30_000,
  }
}
export async function main(input: NodeJS.ProcessEnv): Promise<number> {
  try {
    return await withTestServer(productionHttpOptions(input))
  } catch {
    console.error('Production HTTP verification failed.')
    return 1
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.env)
}
